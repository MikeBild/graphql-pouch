const GraphQL = require('graphql');
const GraphQLRelay = require('graphql-relay');
const payloadInterface = require('./payloadInterface');
const clientMutationId = require('./clientMutationId');
const viewer = require('../queries/viewer');
const connection = require('../queries/connection');

module.exports = {
  createGraphQLInputType: createGraphQLInputType,
  createGraphQLPayloadType: createGraphQLPayloadType,
  createRelayInputType: createRelayInputType,
  createRelayPayloadType: createRelayPayloadType,
};

function createGraphQLInputType(typeName, object_types) {
  return new GraphQL.GraphQLInputObjectType({
    name: `${typeName}Input`,
    description:  `Locates the ${typeName} node to update and specifies some ` +
                  'new field values. Primary key fields are required to be able to locate ' +
                  'the node to update.',
    fields: Object.assign({}, createInputTypeFields(typeName, object_types))
  });
}

function createGraphQLPayloadType(typeName, object_types) {
  return new GraphQL.GraphQLObjectType({
    name: `Upsert${typeName}Payload`,
    description: `Contains the ${typeName} node upserted by the mutation.`,
    fields: {
      [typeName.toLowerCase()]: {
        type: object_types[typeName],
        description: `The upserted ${typeName}.`,
        resolve: source => source[typeName.toLowerCase()],
      },
      [`upserted${typeName}Id`] : {
        type: GraphQL.GraphQLID,
        description: `The upserted ${typeName} id.`,
        resolve: source => source[`upserted${typeName}Id`],
      },
    }
  });
}

function createRelayInputType(typeName, object_types) {
  return new GraphQL.GraphQLInputObjectType({
    name: `Upsert${typeName}Input`,
    description:  `Locates the ${typeName} node to update and specifies some ` +
                  'new field values. Primary key fields are required to be able to locate ' +
                  'the node to update.',
    fields: Object.assign({clientMutationId: clientMutationId.forInput}, createInputTypeFields(typeName, object_types)),
  });
}

function createRelayPayloadType(schemaName, typeName, object_types) {
  return new GraphQL.GraphQLObjectType({
    name: `Upsert${typeName}Payload`,
    description: `Contains the ${typeName} node upserted by the mutation.`,
    interfaces: [payloadInterface.createPayloadInterface(schemaName, object_types)],
    fields: {
      [typeName.toLowerCase()]: {
        type: object_types[typeName],
        description: `The upserted ${typeName}.`,
        resolve: source => source[typeName.toLowerCase()],
      },
      [`upserted${typeName}Id`] : {
        type: GraphQL.GraphQLID,
        description: `The upserted ${typeName} id.`,
        resolve: source => source[`upserted${typeName}Id`],
      },
      [`${typeName.toLowerCase()}Edge`]: {
        type: connection.createConnectionType(schemaName, typeName, object_types).edgeType,
        description: 'An edge to be inserted in a connection with help of the containing cursor.',
        resolve: source => ({
          cursor: 0,
          node: source[`${typeName.toLowerCase()}Edge`] ? source[`${typeName.toLowerCase()}Edge`].node : null,
        }),
      },
      clientMutationId: clientMutationId.forPayload,
      viewer: viewer.createViewerField(schemaName, object_types),
    }
  });
}

function createInputTypeFields(typeName, object_types){
  const result = {};
  const currentFields = object_types[typeName]._typeConfig.fields;
  for(const key in currentFields){
    const currentField = currentFields[key];
    if(currentField.type instanceof GraphQL.GraphQLNonNull
      && currentField.type.ofType
      && currentField.type.ofType instanceof GraphQL.GraphQLScalarType) {
      const cloned = JSON.parse(JSON.stringify(currentField));
      cloned.type = currentField.type.ofType;
      result[currentField.name] = cloned;
    } else if(currentField.type instanceof GraphQL.GraphQLScalarType) {
      result[currentField.name] = currentField;
    }
  }
  return result;
}
