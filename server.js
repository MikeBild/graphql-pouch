const fs = require('fs');
const path = require('path');

const logger = require('morgan');
const _ = require('lodash');
const GraphQL = require('graphql');

const express = require('express');
const expressCors = require('cors');
const expressBodyParser = require('body-parser');
const expressFavicon = require('serve-favicon');
const expressResponseTime = require('response-time');
const expressJWT = require('express-jwt');
const expressGraphQL = require('express-graphql');

const graphqlPouch = require('./lib/pouch-graphql');
const pouch = require('./lib/pouch-graphql/pouchdb');
const functions = require('./lib/functions');

const app = express();
app.disable('x-powered-by');
app.use(expressResponseTime());
app.use(expressBodyParser.json());
app.use(expressCors({credentials: true}));
app.use(expressFavicon(path.join(__dirname, 'favicon.ico')));

app.use('/graphql/:name?', checkJWT, (req, res, next) => {
  const schemaName = req.params.name || 'default';
  const environment = envsCache[schemaName];
  if(!environment || !environment.graphql) return res.status(404).send({message: 'Not found'});

  const defaultEnvironment = resolveEnv('default');
  if(defaultEnvironment.secret && !req.role === 'admin') return res.sendStatus(401);

  return expressGraphQL({
    schema: environment.graphql.schema,
    context: {environment: schemaName, user: req.user},
    pretty: environment.development,
    graphiql: environment.development,
    formatError: environment.development ? developmentFormatError : GraphQL.formatError,
  })(req, res, next);
});
app.all('/functions/:name', checkJWT, (req, res, next) => {
  const docid = req.params.name;
  if(!docid) return res.sendStatus(404);

  const defaultEnvironment = resolveEnv('default');
  if(defaultEnvironment.secret && !req.role === 'admin') return res.sendStatus(401);

  pouch.createPouchDB('default')
    .find({ selector: {docid:docid, doctype:'Function'} })
    .then(data => ({
      id: data._id,
      content: (data.docs && data.docs[0]) ? data.docs[0].content : undefined
    }))
    .then(data => {
      return functions.exec({
        input: req.query || req.body,
        name: req.params.name,
        context: {environment: 'default', user: req.user},
        implementation: data.content,
      });
    })
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
app.get('/*', (req, res, next) => {
  const defaultEnvironment = resolveEnv('default');
  if(defaultEnvironment.secret && !req.role === 'admin') return res.sendStatus(401);

  const docid = path.parse(req.params['0']).base || req.params[0] || 'index.html';
  pouch.createPouchDB('default')
    .find({ selector: {docid:docid, doctype:'Static'} })
    .then(data => ({
      id: docid,
      content: (data.docs && data.docs[0]) ? data.docs[0].content : undefined
    }))
    .then(data => {
      if(!data.content) return res.sendStatus(404);
      res.type(docid);
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
          console.log(`Schema ${x.name} initialized`);
          if(options.development) return console.log(`Schema ${x.name} running - http://127.0.0.1:${options.port}/graphql/${x.name}`);
        });
      })
      .catch(error => console.log(error))

    return {
      default: () => resolveEnv('default', null, options),
      start: () => {
        console.log('\nStarting GraphQL-API runtime ...');
        const server = app.listen(options.port,
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

const envsCache = {};
function resolveEnv(name, schemaDef, options, implementations) {
  if(!envsCache[name]) {
    const schemaFilePath = path.join(__dirname, name+'.graphql');
    envsCache[name] = Object.assign({}, options);
    envsCache[name].name = name;
    envsCache[name].pouchdb = pouch.createPouchDB(name);

    if(name === 'default') {
      // Reinit environments on schema updates
      envsCache[name].pouchdb.changes({
          live: true,
          since: 'now',
        })
        .on('change', info => {
          console.log(`Schema update: Reinit environment ${info.id}`);
          delete envsCache[info.id];
          initEnvs(options);
          return;
        });
    }

    envsCache[name].schemaDef = fs.existsSync(schemaFilePath) ? fs.readFileSync(schemaFilePath).toString() : schemaDef;
    envsCache[name].graphql = graphqlPouch(envsCache[name].name, envsCache[name].schemaDef, envsCache[name].relay, implementations);
    envsCache[name].sync = pouch.sync(envsCache[name].name, envsCache[name].couchURL, envsCache[name].continuous_sync);
  }
  return envsCache[name];
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
  const defaultPouchDB = pouch.createPouchDB('default');

  return defaultPouchDB
    .find({ selector:{doctype:'Function'} })
    .then(result => result.docs.map(x => [x._id, x.content]))
    .then(functionDocs => {
      const implementations = _.fromPairs(functionDocs);

      return defaultPouchDB
        .find({ selector:{doctype:'Schema'} })
        .then(schemaDocs => {
          resolveEnv('default', null, options, implementations);
          return schemaDocs.docs.map(x => {
            try {
              return resolveEnv(x._id, x.content, options, implementations);
            } catch(error) {
              console.error(error)
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
