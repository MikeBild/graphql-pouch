const graphql = require('graphql');
const assert = require('assert');
const _ = require('lodash');

const InputObjectType = graphql.GraphQLInputObjectType;
const InterfaceType = graphql.GraphQLInterfaceType;
const ScalarType = graphql.GraphQLScalarType;
const ObjectType = graphql.GraphQLObjectType;
const UnionType = graphql.GraphQLUnionType;
const NonNullType = graphql.GraphQLNonNull;
const EnumType = graphql.GraphQLEnumType;
const ListType = graphql.GraphQLList;

const builtInScalars = {
  'String': graphql.GraphQLString,
  'Int': graphql.GraphQLInt,
  'Float': graphql.GraphQLFloat,
  'Boolean': graphql.GraphQLBoolean,
  'ID': graphql.GraphQLID,
};

module.exports = (document, name) => {
  let description = [];
  const unions = [];
  const objectTypes = {};
  const interfaceTypes = {};
  const inputTypes = {};
  const unionTypes = {};
  const scalarTypes = {};
  const enumTypes = {};

  document.definitions.forEach(function (node) {
    switch (node.kind) {
      case 'Comment':
        description.push(node.value.substr(1));
        break;
      case 'ObjectTypeDefinition':
        objectTypes[node.name.value] = getObjectTypeDefinition(node);
        break;
      case 'InterfaceTypeDefinition':
        interfaceTypes[node.name.value] = getInterfaceTypeDefinition(node);
        break;
      case 'UnionTypeDefinition':
        unions.push(node);
        break;
      case 'ScalarTypeDefinition':
        scalarTypes[node.name.value] = getScalarTypeDefinition(node);
        break;
      case 'EnumTypeDefinition':
        enumTypes[node.name.value] = getEnumTypeDefinition(node);
        break;
      case 'InputObjectTypeDefinition':
        inputTypes[node.name.value] = getInputObjectTypeDefinition(node);
        break;
      default:
        throw new Error('Unexpected node type ' + node.kind);
    }
  });

  unions.forEach(function (node) {
    unionTypes[node.name.value] = getUnionTypeDefinition(node);
  });

  // evaluate type field expressions
  _.values(objectTypes).forEach(type => type._typeConfig.fields = type._typeConfig.fields());
  _.values(interfaceTypes).forEach(type => type._typeConfig.fields = type._typeConfig.fields());

  return {
    objectTypes: objectTypes,
    interfaceTypes: interfaceTypes,
    inputTypes: inputTypes,
    unionTypes: unionTypes,
    scalarTypes: scalarTypes,
    enumTypes: enumTypes
  };

  function getDescription() {
    if (description.length === 0) return null;
    const prefix = description.reduce(function (a, b) {
      return Math.min(a, /^\s*/.exec(b)[0].length);
    }, Infinity);
    const result = description.map(function (str) {
      return str.substr(prefix);
    }).join('\n');
    description = [];
    return result;
  }

  function getOutputType(node) {
    if (node.kind === 'NamedType') {
      const t = (
        builtInScalars[node.name.value] ||
        objectTypes[node.name.value] ||
        interfaceTypes[node.name.value] ||
        unionTypes[node.name.value] ||
        scalarTypes[node.name.value] ||
        enumTypes[node.name.value] ||
        inputTypes[node.name.value]
      );
      if (!t) {
        throw new Error(node.name.value + ' is not implemented.');
      }
      return t;
    }
    if (node.kind === 'ListType') {
      return new ListType(getOutputType(node.type));
    }
    if (node.kind === 'NonNullType') {
      return new NonNullType(getOutputType(node.type));
    }
    console.dir(node);
    throw new Error(node.kind + ' is not supported');
  }

  function getInputType(node) {
    if (node.kind === 'NamedType') {
      const t = (
        builtInScalars[node.name.value] ||
        interfaceTypes[node.name.value] ||
        unionTypes[node.name.value] ||
        scalarTypes[node.name.value] ||
        enumTypes[node.name.value] ||
        inputTypes[node.name.value]
      );
      if (!t) {
        throw new Error(node.name.value + ' is not implemented.');
      }
      return t;
    }
    if (node.kind === 'ListType') {
      return new ListType(getOutputType(node.type));
    }
    if (node.kind === 'NonNullType') {
      return new NonNullType(getOutputType(node.type));
    }
    console.dir(node);
    throw new Error(node.kind + ' is not supported');
  }

  function getRawValue(node) {
    switch (node.kind) {
      case 'NumberValue':
      case 'StringValue':
      case 'BooleanValue':
        return node.value;
      case 'EnumValue':
        return node.name.value;
      case 'ListValue':
        return node.values.map(getRawValue);
      case 'ObjectValue':
        const res = {};
        node.fields.forEach(function (field) {
          res[field.name.value] = getRawValue(field.value);
        });
        return res;
      default:
        console.dir(node);
        throw new Error(node.kind + ' is not supported');
    }
  }

  function getRawValueFromOfficialSchema(node) {
    switch (node.kind) {
      case 'IntValue':
      case 'FloatValue':
        return JSON.parse(node.value);
      case 'StringValue':
      case 'BooleanValue':
      case 'EnumValue':
        return node.value;
      case 'ListValue':
        return node.values.map(getRawValueFromOfficialSchema);
      case 'ObjectValue':
        const res = {};
        node.fields.forEach(function (field) {
          res[field.name.value] = getRawValueFromOfficialSchema(field.value);
        });
        return res;
      default:
        console.dir(node);
        throw new Error(node.kind + ' is not supported');
    }
  }

  function getInterface(node) {
    assert(node.kind === 'NamedType');
    const t = interfaceTypes[node.name.value];
    if (!t) throw new Error(node.name.value + ' is not defined.');
    return t;
  }

  function getFieldDefinitions(node, isInterface) {
    const fields = {};
    node.fields.forEach(function (field) {
      switch(field.kind) {
        case 'Comment':
          description.push(field.value.substr(1));
          break;
        case 'FieldDefinition':
          let args = undefined;
          if (field.arguments && field.arguments.length) {
            args = {};
            field.arguments.forEach(function (arg) {
              if (arg.kind === 'Comment') return;
              args[arg.name.value] = {
                type: getInputType(arg.type),
                defaultValue: arg.defaultValue ? getRawValue(arg.defaultValue) : undefined
              };
            });
          }
          fields[field.name.value] = {
            name: field.name.value,
            type: getOutputType(field.type),
            description: getDescription(),
            args: args,
            resolve: undefined,
          };

          break;
        default:
          throw new Error('Unexpected node type ' + field.kind);
      }
    });
    return fields;
  }

  function getObjectTypeDefinition(node) {
    const typeName = node.name.value;
    return new ObjectType({
      name: typeName,
      description: getDescription(),
      // TODO: interfaces
      interfaces: node.interfaces
        ? () => node.interfaces.map(getInterface)
        : null,
      fields: () => getFieldDefinitions(node, false)
    });
  }

  function getInterfaceTypeDefinition(node) {
    return new InterfaceType({
      name: node.name.value,
      description: getDescription(),
      resolveType: makeResolveType(node.name.value),
      fields: () => getFieldDefinitions(node, true)
    });
  }

  function getUnionTypeDefinition(node) {
    return new UnionType({
      name: node.name.value,
      description: getDescription(),
      types: node.types.map(getOutputType),
      resolveType: makeResolveType(node.name.value)
    });
  }

  function makeResolveType(nodeValue) {
    return function typeResolver(value, context, info) {
      const resolved = resolver(value, context, info);
      return typeof resolved === 'string' ? objectTypes[resolved] : resolved;
    };
  }

  function getScalarTypeDefinition(node) {
    return new ScalarType({
      name: node.name.value,
      description: getDescription(),
      serialize: imp && imp.serialize,
      parseValue: imp && (imp.parseValue || imp.parse),
      parseLiteral: imp && imp.parseLiteral
        ? imp.parseLiteral
        : imp && (imp.parseValue || imp.parse)
        ? (ast) => (imp.parseValue || imp.parse)(getRawValueFromOfficialSchema(ast))
        : undefined,
    });
  }

  function getEnumTypeDefinition(node){
    const d = getDescription();
    const values = {};
    node.values.forEach(function (value) {
      switch (value.kind) {
        case 'Comment':
          description.push(value.value.substr(1));
          break;
        case 'EnumValueDefinition':
          values[value.name.value] = {
            description: getDescription(),
            value: undefined,
          };
          break;
        default:
          throw new Error('Unexpected node type ' + value.kind);
      }
    });
    return new EnumType({
      name: node.name.value,
      description: d,
      values: values
    });
  }

  function getInputObjectTypeDefinition(node) {
    const fields = {};

    node.fields.forEach(function (field) {
      switch (field.kind) {
        case 'Comment':
          description.push(field.value.substr(1));
          break;
        case 'InputValueDefinition':
          fields[field.name.value] = {
            name: field.name,
            description: getDescription(),
            type: getInputType(field.type),
            defaultValue: field.defaultValue ? getRawValue(field.defaultValue) : undefined
          };
          break;
        default:
          throw new Error('Unexpected node type ' + field.kind);
      }
    });

    return new InputObjectType({
      name: node.name.value,
      description: getDescription(),
      fields: fields,
    });
  }
};
