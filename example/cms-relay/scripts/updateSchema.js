const manifest = require('../package.json');
const INTROSPECTION_HOST = 'http://localhost:3000/graphql/cms';

const GraphQLUtils = require('graphql/utilities');
const fs = require('fs');
const path = require('path');
const request = require('request');

console.log('Fetching GraphQL schema from ' + INTROSPECTION_HOST);

request({
  uri: INTROSPECTION_HOST,
  method: 'POST',
  body: {query: GraphQLUtils.introspectionQuery},
  json: true
}, (error, response, body) => {
  if (error) return console.error(error);
  fs.writeFileSync(path.join(__dirname, 'schema.json'), JSON.stringify(body, null, 2));
  console.log('JSON Schema written.');
});