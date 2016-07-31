const GraphQL = require('graphql');
const _ = require('lodash');
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
        resolve: source => source
      },
      [`upserted${typeName}Id`] : {
        type: GraphQL.GraphQLID,
        description: `The upserted ${typeName} id.`,
        resolve: source => source.id,
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
        resolve: source => source,
      },
      [`upserted${typeName}Id`] : {
        type: GraphQL.GraphQLID,
        description: `The upserted ${typeName} id.`,
        resolve: source => source.id,
      },
      [`${typeName.toLowerCase()}Edge`]: {
        type: connection.createConnectionType(schemaName, typeName, object_types).edgeType,
        description: 'An edge to be inserted in a connection with help of the containing cursor.',
        resolve: source => ({
          cursor: 0,
          node: source,
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
      const cloned = _.cloneDeep(currentField);
      cloned.type = currentField.type.ofType;
      result[currentField.name] = cloned;
    } else if(currentField.type instanceof GraphQL.GraphQLScalarType) {
      result[currentField.name] = currentField;
    }
  }
  return result;
}
