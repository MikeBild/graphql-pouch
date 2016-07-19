const GraphQL = require('graphql');
const resolver = require('./resolver');
const createDeleteMutationField = require('./mutations/createDeleteMutationField');
const createUpsertMutationField = require('./mutations/createUpsertMutationField');

module.exports = {
  generate: generate,
};

function generate(name, types, relayEnabled) {
  let interface_types = types.interfaceTypes;
  let object_types = types.objectTypes;
  let input_types = types.inputTypes;
  let all_interface_types = Object.keys(interface_types).map(x => interface_types[x]) || [];
  let all_output_types = Object.keys(object_types).map(x => object_types[x]) || [];
  let all_custom_output_names = all_output_types.map(x => x.name).filter(x => x !== 'Query' && x !== 'Mutation' && x !== 'Viewer' && x.indexOf('Connection') === -1 && x.indexOf('Payload') === -1);
  let all_custom_interface_names = all_interface_types.map(x => x.name).filter(x => x !== 'Node');

  all_custom_interface_names.forEach(interfaceName => {
    createInterfaceResolverFor(interfaceName, interface_types, (obj, ctx, info) => obj.doctype);
  });

  all_custom_output_names.forEach(typeName => {
    createRootQueryFields(typeName, object_types, resolver.resolveListOrSingle);
    createComplexResolverFor(typeName, object_types, resolver.resolveByParentId);
    createListResolverFor(typeName, object_types, resolver.resolveListOrSingle);

    if(!relayEnabled) createUpsertMutationFor(typeName, object_types, input_types, resolver.resolveUpsert);
    if(!relayEnabled) createDeleteMutationFor(typeName, object_types, resolver.resolveDelete);
  });
}

function createRootQueryFields(typeName, object_types, resolverFunction){
  let fieldName = typeName.toLowerCase();
  let rootQueryListFieldName = `all${typeName}s`;

  Object.assign(object_types.Query._typeConfig.fields, {
    [rootQueryListFieldName]: {
      name: rootQueryListFieldName,
      type: new GraphQL.GraphQLList(object_types[typeName]),
      resolve: (parent, args, ctx, info) => {
        const currentOutputType = object_types[typeName];
        const currentOutputTypeName = currentOutputType.name;
        const currentInterfaceTypeName = currentOutputType.ofType ? currentOutputType.ofType.name : undefined;
        const resolvedTypeName = currentInterfaceTypeName || currentOutputTypeName;
        return resolverFunction(parent, args, ctx, info, resolvedTypeName);
      }
    },
    [fieldName]: {
      name: fieldName,
      type: object_types[typeName],
      args: { id: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLID) } },
      resolve: (parent, args, ctx, info) => {
        const currentOutputType = object_types[typeName];
        const currentOutputTypeName = currentOutputType.name;
        const currentInterfaceTypeName = currentOutputType.ofType ? currentOutputType.ofType.name : undefined;
        const resolvedTypeName = currentInterfaceTypeName || currentOutputTypeName;
        return resolverFunction(parent, args, ctx, info, resolvedTypeName);
      }
    }
  });
}

function createComplexResolverFor(typeName, object_types, resolverFunction) {
  let outputType = object_types[typeName];
  let currentOutputTypeFields = outputType._typeConfig.fields;

  for(let field in currentOutputTypeFields){
    let fieldValue = currentOutputTypeFields[field];
    if(fieldValue.type instanceof GraphQL.GraphQLObjectType){
      // console.dir(`Complex type ${fieldValue.type.name} found in ${outputType.name} for edge ${fieldValue.name}`);
      fieldValue.description = `Load object of type ${fieldValue.type.name}`;
      fieldValue.resolve =  function(parent, args, ctx, info) {
        const currentOutputType = fieldValue;
        const currentOutputTypeName = currentOutputType.name;
        const currentInterfaceTypeName = currentOutputType.ofType ? currentOutputType.ofType.name : undefined;
        const resolvedTypeName = currentInterfaceTypeName || currentOutputTypeName;
        return resolverFunction(parent, args, ctx, info, resolvedTypeName);
      };
    }
  }
}

function createListResolverFor(typeName, object_types, resolverFunction) {
  let outputType = object_types[typeName];
  let currentOutputTypeFields = outputType._typeConfig.fields;

  for(let field in currentOutputTypeFields){
    let fieldValue = currentOutputTypeFields[field];
    if(fieldValue.type instanceof GraphQL.GraphQLList){
      // console.dir(`List of type ${fieldValue.type.ofType.name} found in ${outputType.name} for edge ${fieldValue.name}`);
      fieldValue.description = `Load list of type ${fieldValue.type.ofType.name}`;
      fieldValue.args = { id: { type: GraphQL.GraphQLID } };
      fieldValue.resolve =  function(parent, args, ctx, info) {
        const currentOutputType = fieldValue.type.ofType;
        const currentOutputTypeName = currentOutputType.name;
        const currentInterfaceTypeName = currentOutputType.ofType ? currentOutputType.ofType.name : undefined;
        const resolvedTypeName = currentInterfaceTypeName || currentOutputTypeName;
        return resolverFunction(parent, args, ctx, info, resolvedTypeName);
      };
    }
  }
}

function createDeleteMutationFor(typeName, object_types, resolverFunction) {
  let rootMutationFieldName = 'delete'+typeName;
  Object.assign(object_types.Mutation._typeConfig.fields, {
    [`${rootMutationFieldName}`]: {
      name: rootMutationFieldName,
      type: createDeleteMutationField.createGraphQLPayloadType(typeName, object_types),
      description: `Delete an ${typeName} with id and return the ${typeName} that was deleted.`,
      args: createDeleteMutationField.createGraphQLInputType(typeName),
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

function createUpsertMutationFor(typeName, object_types, input_types, resolverFunction) {
  let rootMutationFieldName = 'upsert'+typeName;
  Object.assign(object_types.Mutation._typeConfig.fields, {
    [`${rootMutationFieldName}`]: {
      name: rootMutationFieldName,
      type: createUpsertMutationField.createGraphQLPayloadType(typeName, object_types),
      description: `Delete an ${typeName} with id and return the ${typeName} that was deleted.`,
      args: {
        input: { type: createUpsertMutationField.createGraphQLInputType(typeName, object_types) }
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

function createInterfaceResolverFor(interfaceName, interface_types, resolverFunction) {
  let currentInterfaceType = interface_types[interfaceName];
  currentInterfaceType.resolveType = resolverFunction;
}
