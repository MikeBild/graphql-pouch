const GraphQL = require('graphql');

const forInput = {
  type: GraphQL.GraphQLString,
  description:
    'An optional mutation ID for client’s to use in tracking mutations. ' +
    'This field has no meaning to the server and is simply returned as ' +
    'is.',
};

const forPayload = {
  type: GraphQL.GraphQLString,
  description:
    'If the mutation was passed a `clientMutationId` in the input object this ' +
    'is the exact same value echoed back.',
  resolve: ({ clientMutationId }) => clientMutationId,
};

module.exports = {
  forInput: forInput,
  forPayload: forPayload,
};
