const GraphQL = require('graphql');
const nodeField = require('./queries/node');

module.exports = {
  generate: generate
};

function generate(schemaName, types, relayEnabled) {
  const interface_types = types.interfaceTypes;
  const object_types = types.objectTypes;

  // Query and Mutation type
  if(!object_types.Query) object_types.Query =  new GraphQL.GraphQLObjectType({name: 'Query', fields: {} });
  if(!object_types.Mutation) object_types.Mutation =  new GraphQL.GraphQLObjectType({name: 'Mutation', fields: {} });

  // Node type
  interface_types.Node = nodeField.createNodeField(schemaName, object_types).nodeInterface;
}
