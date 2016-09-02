const nodeField = require('./queries/node');
const viewerField = require('./queries/viewer');
const resolver = require('./resolver');
const createDeleteMutationField = require('./mutations/createDeleteMutationField');
const createUpsertMutationField = require('./mutations/createUpsertMutationField');

module.exports = {
  generate: generate,
};

function generate(schemaName, types, relayEnabled){
  if(!relayEnabled) return;

  const object_types = types.objectTypes;
  const all_output_types = Object.keys(object_types).map(x => object_types[x]) || [];
  const all_custom_output_names = all_output_types.map(x => x.name).filter(x => x !== 'Query' && x !== 'Mutation' && x !== 'Viewer' && x.indexOf('Connection') === -1 && x.indexOf('Payload') === -1);

  Object.assign(object_types.Query._typeConfig.fields, {
    node: nodeField.createNodeField(schemaName, object_types).nodeField,
    viewer: viewerField.createViewerField(schemaName, object_types)
  });

  all_custom_output_names.forEach(typeName => {
    createUpsertMutationFor(schemaName, typeName, object_types, resolver.resolveUpsert);
    createDeleteMutationFor(schemaName, typeName, object_types, resolver.resolveDelete);
  });
}

function createDeleteMutationFor(schemaName, typeName, object_types, resolverFunction) {
  const rootMutationFieldName = 'delete'+typeName;
  Object.assign(object_types.Mutation._typeConfig.fields, {
    [`${rootMutationFieldName}`]: {
      name: rootMutationFieldName,
      type: createDeleteMutationField.createRelayPayloadType(schemaName, typeName, object_types),
      description: `Delete an ${typeName} with id and return the ${typeName} that was deleted.`,
      args: {
        input: { type: createDeleteMutationField.createRelayInputType(typeName) }
      },
      resolve: function(parent, args, ctx, info) {
        const currentOutputType = object_types[typeName];
        const currentOutputTypeName = currentOutputType.name;
        const currentInterfaceTypeName = currentOutputType.ofType ? currentOutputType.ofType.name : undefined;
        const resolvedTypeName = currentInterfaceTypeName || currentOutputTypeName;
        return resolverFunction(parent, args, ctx, info, resolvedTypeName);
      }
    }
  });
}

function createUpsertMutationFor(schemaName, typeName, object_types, resolverFunction) {
  const rootMutationFieldName = 'upsert'+typeName;
  Object.assign(object_types.Mutation._typeConfig.fields, {
    [`${rootMutationFieldName}`]: {
      name: rootMutationFieldName,
      type: createUpsertMutationField.createRelayPayloadType(schemaName, typeName, object_types),
      description: `Delete an ${typeName} with id and return the ${typeName} that was deleted.`,
      args: {
        input: { type: createUpsertMutationField.createRelayInputType(typeName, object_types) }
      },
      resolve: function(parent, args, ctx, info) {
        const currentOutputType = object_types[typeName];
        const currentOutputTypeName = currentOutputType.name;
        const currentInterfaceTypeName = currentOutputType.ofType ? currentOutputType.ofType.name : undefined;
        const resolvedTypeName = currentInterfaceTypeName || currentOutputTypeName;
        return resolverFunction(parent, args, ctx, info, resolvedTypeName);
      }
    }
  });
}

// function createConnectionResolverFor(typeName, object_types, implementation, fallbackFunction){
//   const outputType = object_types[typeName];
//   const currentOutputTypeFields = outputType._typeConfig.fields();

//   for(const field in currentOutputTypeFields){
//     const fieldValue = currentOutputTypeFields[field];
//     if(fieldValue.type instanceof GraphQL.GraphQLObjectType
//         && fieldValue.type
//         && fieldValue.type.name
//         && fieldValue.type.name.indexOf('Connection') !== -1) {
//       //console.dir(`Connection of type ${fieldValue.type.name} found in ${outputType.name} for edge ${fieldValue.name}`);
//       fieldValue.resolve = (parent, args, ctx, info) => fallbackFunction(parent, args, ctx, info, fieldValue.type.name.replace('Connection', ''));
//     }
//   }
// }
