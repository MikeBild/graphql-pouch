const vm = require('vm');
const _ = require('lodash');
const EXEC_TIMEOUT = 60000;
const pouch = require('../pouch-graphql/pouchdb');
const session = {};

module.exports = {
  exec: exec,
};

function exec(params) {
  let logOutput = '';
  let implementation = params.implementation;
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
      console: console,
      Buffer: Buffer,
    };
    const moduleExecutionContext = {
      pouchdb: envName => pouch.createPouchDB(envName || 'default'),
      log: value => {
        logOutput += `${JSON.stringify(value, null, 2)}\\r\\n`;
      },
      context: Object.assign({}, params.context, {variables: _.mapKeys(process.env, (value, key) => (key.indexOf('GP_') !== -1) ? key.replace('GP_', '') : null)}),
      session: session,
    };
    _.unset(moduleExecutionContext, 'context.variables.null');

    const done = new Promise((resolve, reject) => {
      moduleExecutionContext.success = resolve;
      moduleExecutionContext.failure = reject;
    });

    scriptSandbox.moduleExecutionContext = moduleExecutionContext;
    scriptSandbox.args = params.args;
    scriptSandbox.parent = params.parent;
    scriptSandbox.context = params.context;
    vm.createContext(scriptSandbox);
    setTimeout(() => moduleExecutionContext.failure(new Error('Execution timeout')), EXEC_TIMEOUT);
    vm.runInContext(`${implementation}\r\nmodule.exports(moduleExecutionContext, args, parent);`, scriptSandbox, {filename: params.name, displayErrors: false, timeout: EXEC_TIMEOUT});

    return done
      .then(output => {
        if(_.isObject(output) && logOutput) return Object.assign(output, {log:logOutput});
        return output;
      });

  } catch(error) {
    console.error(error);
    return Object.assign({message: error.message ? error.message : error}, {log:logOutput});
  }
}
