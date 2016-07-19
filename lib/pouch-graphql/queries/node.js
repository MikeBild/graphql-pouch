const GraphQLRelay = require('graphql-relay');
const _ = require('lodash');

const resolver = require('../resolver');

module.exports = {
  createNodeField: _.memoize(createNodeField),
};

function createNodeField(schemaName, object_types){
  return GraphQLRelay.nodeDefinitions(globalId => {
    if(globalId === 'viewer') return Promise.resolve({ id: 'viewer' });
    return resolver.resolveNode(schemaName, globalId);
  }, obj => {
    if(obj.id === 'viewer') return require('./viewer').createViewerField(schemaName, object_types).type;
    return object_types[obj.doctype];
  });
}
