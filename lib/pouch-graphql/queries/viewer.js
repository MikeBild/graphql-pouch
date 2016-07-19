const GraphQL = require('graphql');
const GraphQLRelay = require('graphql-relay');
const _ = require('lodash');
const resolver = require('../resolver');
const node = require('./node');
const connection = require('./connection');

module.exports = {
  createViewerField: _.memoize(createViewerField)
};

function createViewerField(schemaName, object_types){
  return {
    type: new GraphQL.GraphQLObjectType({
      name: 'Viewer',
      description: 'The viewer type, provides a “view” into your data. To be used with Relay.',
      interfaces: [node.createNodeField(schemaName, object_types).nodeInterface],
      isTypeOf: value => value.id === 'viewer',
      fields: Object.assign({
        id: {
          type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLID),
          description:  'An identifier for the viewer node. Just the plain string “viewer.” ' +
                        'Can be used to refetch the viewer object in the `node` field. This ' +
                        'is required for Relay.',
          resolve: () => 'viewer',
        }
      }, createConnections(schemaName, object_types)),
     }),
    description:  'A single entry query for the advanced data client Relay. Nothing ' +
                  'special at all, if you don’t know what this field is for, you probably ' +
                  'don’t need it.',
    resolve: () => ({ id: 'viewer' }),
  };
}

function createConnections(schemaName, object_types){
  let all_output_types = Object.keys(object_types).map(x => object_types[x]) || [];
  let all_custom_output_names = all_output_types.map(x => x.name).filter(x => x !== 'Query' && x !== 'Mutation' && x !== 'Selector');

  return _.fromPairs(all_custom_output_names.map(typeName => [`all${typeName}s`, {
      type: connection.createConnectionType(schemaName, typeName, object_types).connectionType,
      args: GraphQLRelay.connectionArgs,
      resolve: (parent, args, ctx, info) => resolver.resolveConnection(parent, args, ctx, info, typeName)
    }]));
}