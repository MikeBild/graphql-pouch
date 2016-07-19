const GraphQL = require('graphql');
const introspection = require('graphql/utilities').introspectionQuery;
const parse = require('./parse');
const typing = require('./generate');
const types = require('./types');
const relay = require('./relay');
const graph = require('./graph');
const customFunctions = require('./custom-functions');

module.exports = function (schemaName, schemaDef, relayEnabled, customFunctionNames) {
  var schemaTypes = typing(parse(schemaDef), schemaName);
  
  types.generate(schemaName, schemaTypes, relayEnabled);  
  graph.generate(schemaName, schemaTypes, relayEnabled);
  relay.generate(schemaName, schemaTypes, relayEnabled);
  customFunctions.generate(schemaName, schemaTypes, relayEnabled, customFunctionNames);

  const graphqlSchema = new GraphQL.GraphQLSchema({
    query: schemaTypes.objectTypes['Query'],
    mutation: schemaTypes.objectTypes['Mutation'],
    subscription: schemaTypes.objectTypes['Subscription'],
    types: Object.keys(schemaTypes.objectTypes).map(x => schemaTypes.objectTypes[x]) || []
  });

  function query(query, params, root_value, context_value, operation) {
    return GraphQL.graphql(graphqlSchema, query, root_value, context_value, params || {}, operation);
  }
  
  query.schema = graphqlSchema;
  query.query = query;  
  query.introspection = () => GraphQL.graphql(graphqlSchema, introspection);

  return query;
}