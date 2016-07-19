const fs = require('fs');
const path = require('path');

const logger = require('morgan');
const GraphQL = require('graphql');

const express = require('express');
const expressCors = require('cors');
const expressBodyParser = require('body-parser');
const expressFavicon = require('serve-favicon');
const expressResponseTime = require('response-time');
const expressJWT = require('express-jwt');
const expressGraphQL = require('express-graphql');

const Schema = require('./lib/pouch-graphql');
const PouchDB = require('./lib/pouch-graphql/pouchdb');
const customFunctions = require('./lib/functions');

const envs = {};
const app = express();
app.disable('x-powered-by');
app.use(expressResponseTime());
app.use(expressBodyParser.json());
app.use(expressCors());
app.use(expressFavicon(path.join(__dirname, 'favicon.ico')));

app.use('/graphql/:name?', checkJWT, (req, res, next) => {
  let schemaName = req.params.name || 'default';
  let environment = envs[schemaName];
  if(environment.secret && !req.role === 'admin') return res.sendStatus(401);
  if(!environment || !environment.graphql) return res.status(404).send({message: 'Not found'});

  return expressGraphQL({
    schema: environment.graphql.schema,
    context: {environment: schemaName, user: req.user},
    pretty: environment.development,
    graphiql: environment.development,
    formatError: environment.development ? developmentFormatError : GraphQL.formatError,
    graphiql: true,
  })(req, res, next);
});
app.all('/functions/:name', checkJWT, (req, res, next) => {
  const defaultEnvironment = envs['default'];
  if(defaultEnvironment.secret && !req.role === 'admin') return res.sendStatus(401);

  const payload = {
    input: req.query || req.body,
    name: req.params.name,
    user: req.user,
  };

  customFunctions
    .exec(payload)
    .then(data => {
      if(data.message) return res.status(500).send({message: data.message});
      res.set({'X-Response-Log': data.log});
      res.send(data);
    })
    .catch(error => {
      if(error && error.message === 'Not found') return res.status(404).send({message: error.message});
      res.status(500).send({message: error.message});
    });
});
app.get('/*', checkJWT, (req, res, next) => {
  const defaultEnvironment = envs['default'];
  if(defaultEnvironment.secret && !req.role === 'admin') return res.sendStatus(401);

  const docid = path.parse(req.params[0] || 'index.html').name;
  const selector = { selector:{docid:docid, doctype:'Static'} };

  PouchDB.createPouchDB('default')
    .find(selector)
    .then(data => ({
      id: docid,
      content: (data.docs && data.docs[0]) ? data.docs[0].content : undefined
    }))
    .then(data => {
      if(!data.content) return res.sendStatus(404);
      res.send(data.content);
    })
    .catch(error => res.status(500).send({message: error.message}));
});
app.use((err, req, res, next) => {
  if(err.name === 'UnauthorizedError') return res.status(401).send({ message: err.message });
  if(err.message === 'Unauthorized') return res.status(401).send({ message: err.message });
  res.status(500).send({ message: err.message });
});

module.exports = {
  init: (options) => {
    initEnvs(options)
      .then(data => {
        data.forEach(x => {
          if(x.message) return console.log(`GraphQL schema ${x.name} initialization error: ${x.message}`);
          console.log(`GraphQL schema ${x.name} initialized`);
        });
      });
    return {
      default: () => resolveEnv('default', null, options),
      start: () => {
        console.log('Starting GraphQL-API runtime ...');
        let server = app.listen(options.port,
          () => console.log(`Listen on port ${server.address().port}
CouchDB sync URL: ${options.couchURL || 'none'}
Relay enabled: ${options.relay || false}
Development mode: ${options.development}
JWT-Authentication: ${options.secret ? true : false}`)
          );
        if (options.development) app.use(logger(options.development ? 'dev' : 'common'));
        return { stop: () => server.close() };
      }
    };
  }
};

function resolveEnv(name, schemaDef, options, customFunctionNames) {
  if(!envs[name]) {
    const schemaFilePath = path.join(__dirname, name+'.graphql');

    envs[name] = Object.assign({}, options);
    envs[name].name = name;
    envs[name].pouchdb = PouchDB.createPouchDB(name);
    envs[name].sync = PouchDB.sync(envs[name].name, envs[name].couchURL, options.continuous_sync);
    envs[name].schemaDef = fs.existsSync(schemaFilePath) ? fs.readFileSync(schemaFilePath).toString() : schemaDef;
    envs[name].graphql = Schema(envs[name].name, envs[name].schemaDef, options.relay, customFunctionNames);
  }
  return envs[name];
}

function developmentFormatError(error) {
  console.error(error.stack);
  return {
    message: error.message,
    locations: error.locations,
    stack: error.stack,
  };
}

function initEnvs(options){
  const defaultPouchDB = PouchDB.createPouchDB('default');
  const defaultPouchDBSync = PouchDB.sync('default', options.couchURL, options.continuous_sync);

  return defaultPouchDB
    .find({ selector:{doctype:'Function'} })
    .then(functionDocs => functionDocs.docs.map(x => x._id))
    .then(functionNames => {
      return defaultPouchDB
        .find({ selector:{doctype:'Schema'} })
        .then(schemaDocs => {
          resolveEnv('default', null, options, functionNames);
          return schemaDocs.docs.map(x => {
            try {
              return resolveEnv(x._id, x.content, options, functionNames);
            } catch(error) {
              return {name: x._id, message: error.message};
            }
          });
        });
    });
}

function checkJWT(req, res, next){
  return expressJWT({
    secret: resolveSecret,
    credentialsRequired: resolveEnv('default').secret ? true : false,
    getToken: () => getTokenFromHeaderOrQuerystring(req),
  })(req, res, next);
}

function getTokenFromHeaderOrQuerystring(req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') return req.headers.authorization.split(' ')[1];
  if (req.query && req.query.token) return req.query.token;
  return null;
}

function resolveSecret(req, payload, done){
  done(null, resolveEnv('default').secret);
}
