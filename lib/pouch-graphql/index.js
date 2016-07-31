const GraphQL = require('graphql');
const introspection = require('graphql/utilities').introspectionQuery;
const parse = require('./parse');
const typing = require('./generate');
const types = require('./types');
const relay = require('./relay');
const graph = require('./graph');
const functions = require('./custom-functions');

module.exports = (schemaName, schemaDef, relayEnabled, implementations) => {
  const forSchema = schemaName + '-' + Date.now(); // memoized GraphQL.GraphQLSchema refresh
  const schemaTypes = typing(parse(schemaDef), forSchema);

  types.generate(forSchema, schemaTypes, relayEnabled);
  graph.generate(forSchema, schemaTypes, relayEnabled);
  relay.generate(forSchema, schemaTypes, relayEnabled);
  functions.generate(forSchema, schemaTypes, relayEnabled, implementations);

  const graphqlSchema = new GraphQL.GraphQLSchema({
    query: schemaTypes.objectTypes['Query'],
    mutation: schemaTypes.objectTypes['Mutation'],
    subscription: schemaTypes.objectTypes['Subscription'],
    types: Object.keys(schemaTypes.objectTypes).map(x => schemaTypes.objectTypes[x]) || [],
  });

  function query(query, params, root_value, context_value, operation) {
    return GraphQL.graphql(graphqlSchema, query, root_value, context_value, params || {}, operation);
  }

  query.schema = graphqlSchema;
  query.query = query;
  query.introspection = GraphQL.graphql(graphqlSchema, introspection);

  return query;
};
