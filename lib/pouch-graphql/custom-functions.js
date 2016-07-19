const PouchDB = require('./pouchdb');
const customFunctions = require('../functions');

module.exports = {
  generate: generate
};

function generate(schemaName, schemaTypes, relayEnabled, customFunctionNames){
  if(!customFunctionNames) return;

  const object_types = schemaTypes.objectTypes;
  const all_object_types = Object.keys(object_types).map(x => object_types[x]) || [];
  all_object_types.forEach(type => {
    createFunctionResolver(type, customFunctionNames);
  });
}

function createFunctionResolver(type, functionNames){
  let typeFields = type._typeConfig ? type._typeConfig.fields : type.fields;

  for(let field in typeFields){
    let fieldValue = typeFields[field];
    if(functionNames.indexOf(fieldValue.name) !== -1) {
      fieldValue.resolve = function(parent, args, ctx, info) {
        return customFunctions.exec({
          name: fieldValue.name,
          context: ctx,
          input: args
        });
      };
    }
  }
}
