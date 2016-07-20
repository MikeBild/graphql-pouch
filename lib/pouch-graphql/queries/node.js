const GraphQLRelay = require('graphql-relay');
const _ = require('lodash');

const resolver = require('../resolver');

module.exports = {
  createNodeField: _.memoize(createNodeField),
};

function createNodeField(environment, object_types){
  return GraphQLRelay.nodeDefinitions((globalId, ctx, info) => {
    if(globalId === 'viewer') return Promise.resolve({ id: 'viewer' });
    return resolver.resolveNode(ctx.environment, globalId);
  }, obj => {
    if(obj.id === 'viewer') return require('./viewer').createViewerField(ctx.environment, object_types).type;
    return object_types[obj.doctype];
  });
}
