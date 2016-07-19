const fs = require('fs');
const path = require('path');
const vm = require('vm');
const execTimeout = 100;
const PouchDB = require('../pouch-graphql/pouchdb');

module.exports = {
  exec: exec,
  getAll: getAll
};

function getAll(){
  return PouchDB.createPouchDB('default')
    .find({ selector:{doctype:'Function'} })
    .then(data => {
      return data.docs.map(doc => ({
        id: doc._id,
        content: doc.content
      }));
    });
}

function exec(args) {
  let logOutput = '';
  const docid = args.name;
  const selector = { selector:{docid:docid, doctype:'Function'} };

  return PouchDB.createPouchDB('default')
    .find(selector)
    .then(data => ({
      id: docid,
      content: (fs.existsSync(path.resolve(docid))) ? fs.readFileSync(path.resolve(docid+'.js')).toString() : data.docs[0] ? data.docs[0].content : ''
    }))
    .then(data => {
      if(!data.content) throw new Error('Not found');

      try {
        const scriptSandbox = {
          require: require,
          module: module,
          exports: module.exports,
          setTimeout: setTimeout,
          clearTimeout: clearTimeout,
          setInterval: setInterval,
          clearInterval: clearInterval,
          console: console
        };

        const moduleExecutionContext = {
          pouchdb: envName => PouchDB.createPouchDB(envName || 'default'),
          log: value => {
            logOutput += `${JSON.stringify(value, null, 4)}\\r\\n`;
          }
        };

        const done = new Promise((resolve, reject) => {
          moduleExecutionContext.success = resolve;
          moduleExecutionContext.failure = reject;
        });

        scriptSandbox.moduleExecutionContext = moduleExecutionContext;
        scriptSandbox.data = args.input;
        scriptSandbox.context = args.context;

        vm.createContext(scriptSandbox);
        setTimeout(() => moduleExecutionContext.failure(new Error('Time out')), execTimeout);
        vm.runInContext(data.content + '\r\n module.exports(moduleExecutionContext, data);', scriptSandbox, {filename: data.id, displayErrors: false, timeout: execTimeout});

        return done
          .then(output => Object.assign(output, {log:logOutput}))
          .catch(error => Object.assign({message: error.message ? error.message : error}, {log:logOutput}));

      } catch(error) {
        return Object.assign({message: error.message ? error.message : error}, {log:logOutput});
      }
    });
}
