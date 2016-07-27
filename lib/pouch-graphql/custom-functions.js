const pouch = require('./pouchdb');
const functions = require('../functions');

module.exports = {
  generate: generate
};

function generate(schemaName, schemaTypes, relayEnabled, implementation){
  if(!implementation) return;

  const object_types = schemaTypes.objectTypes;
  const all_object_types = Object.keys(object_types).map(x => object_types[x]) || [];

  all_object_types.forEach(type => createFunctionResolver(type, implementation));
  if(relayEnabled) createViewerFunctionResolver(object_types.Query._typeConfig.fields.viewer.type, implementation);
}

function createFunctionResolver(type, implementation){
  let typeFields = type._typeConfig ? type._typeConfig.fields : type.fields;

  for(let field in typeFields){
    let fieldValue = typeFields[field];

    if(implementation && implementation[fieldValue.name]) {
      fieldValue.resolve = (parent, args, ctx, info) => {
        return functions.exec({
          name: fieldValue.name,
          implementation: implementation[fieldValue.name],
          context: ctx,
          input: args
        });
      };
    }
  }
}

function createViewerFunctionResolver(type, implementation){
  let typeFields = type._typeConfig.fields;
  for(let field in typeFields){
    let fieldValue = typeFields[field];

    if(implementation && implementation.viewer && implementation.viewer[field]) {
      fieldValue.resolve = (parent, args, ctx, info) => {
        return functions.exec({
          name: field,
          implementation: implementation.viewer[field],
          context: ctx,
          input: args
        });
      };
    }
  }
}
