const GraphQL = require('graphql');
const _ = require('lodash');

const clientMutationId = require('./clientMutationId');
const viewer = require('../queries/viewer');

module.exports = {
  createPayloadInterface: _.memoize(createPayloadInterface),
};

function createPayloadInterface(schemaName, object_types) {
  return new GraphQL.GraphQLInterfaceType({
    name: 'Payload',
    description: 'The payload of any mutation which contains a few important fields.',
    resolveType: () => null,
    fields: {
      clientMutationId: clientMutationId.forPayload,
      viewer: viewer.createViewerField(schemaName, object_types),
    },
  })
}