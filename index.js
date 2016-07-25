const schema = require('./lib/pouch-graphql');
const pouch = require('./lib/pouch-graphql/pouchdb');
const functions = require('./lib/functions');

module.exports = {
  schema: schema,
  pouch: pouch,
  functions: functions,
};
