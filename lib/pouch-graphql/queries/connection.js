const GraphQLRelay = require('graphql-relay');
const _ = require('lodash');

module.exports = {
  createConnectionType: _.memoize(createConnectionType, function() {
    return arguments[0]+':::'+arguments[1];
  }),
};

function createConnectionType(schemaName, typeName, object_types){
  return GraphQLRelay.connectionDefinitions({name: typeName, nodeType: object_types[typeName]});
}
