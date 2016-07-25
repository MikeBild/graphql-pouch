const fs = require('fs');
const path = require('path');
const vm = require('vm');
const _ = require('lodash');
const EXEC_TIMEOUT = 2000;
const pouch = require('../pouch-graphql/pouchdb');

module.exports = {
  exec: exec,
};

function exec(args) {
  let logOutput = '';
  let implementation = args.implementation;
  if(_.isFunction(implementation)) implementation = `module.exports=${implementation.toString()}`;

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
      pouchdb: envName => pouch.createPouchDB(envName || 'default'),
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
    setTimeout(() => moduleExecutionContext.failure(new Error('Time out')), EXEC_TIMEOUT);
    vm.runInContext(`${implementation}\r\nmodule.exports(moduleExecutionContext, data);`, scriptSandbox, {filename: args.name, displayErrors: false, timeout: EXEC_TIMEOUT});

    return done
      .then(output => Object.assign(output, {log:logOutput}))
      .catch(error => Object.assign({message: error.message ? error.message : error}, {log:logOutput}));

  } catch(error) {
    console.log(error)
    return Object.assign({message: error.message ? error.message : error}, {log:logOutput});
  }
}
