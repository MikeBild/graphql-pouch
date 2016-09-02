const _ = require('lodash');

module.exports = () => {
  log.context = { subject: 'system', source: 'none' };

  return {
    function: (source) => {
      log.context = { subject: 'function', source: source };
      return {
        log: log.bind(console.log),
        error: error.bind(console.error),
      };
    },
    log: log.bind(console.log),
    error: error.bind(console.error),
  };
};

function log() {
  if(process.env.NODE_ENV === 'production') arguments[0] = JSON.stringify({subject: log.context.subject, source: log.context.source, data: arguments[0]});
  this.apply(console, arguments);
}

function error() {
  if(process.env.NODE_ENV === 'production') arguments[0] = JSON.stringify({subject: log.context.subject, source: log.context.source, data: _.isError(arguments[0]) ? arguments[0].message : arguments[0]});
  this.apply(console, arguments);
}
