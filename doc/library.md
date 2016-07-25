# Using GraphQL-Pouch as a Library

People may want to use GraphQL-Pouch as a library of their own NodeJS projects. GraphQL-Pouch supports this functionality.

To use GraphQL-Pouch as a library just do or fork [graphql-pouch-as-library](https://github.com/MikeBild/graphql-pouch-as-library):

```javascript
const SERVICE_PORT = process.env.SERVICE_PORT || 3000;
const ENVIRONMENT = 'default';
const ENABLE_RELAY = true;
const CUSTOM_FUNCTIONS = {
  settingByKey: (ctx, input) => {
    //Fake output result to demonstrate custom functions.
    ctx.success({
      id: 'A',
      rev: 'B',
      key: input.key,
    });

  }
};
const SCHEMA_DEFINITION = `
#A simple Type for demonstration.
type Setting implements Node {
  id: ID!
  rev: String
  key: String
}

type Query {
  #A custom function implementation
  settingByKey(key: String!): Setting
}
`;
const express = require('express');
const expressMorgan = require('morgan');
const expressCors = require('cors');
const expressBodyParser = require('body-parser');
const expressGraphQL = require('express-graphql');
const graphqlPouch = require('graphql-pouch');
const defaultSchema = graphqlPouch.schema(ENVIRONMENT, SCHEMA_DEFINITION, ENABLE_RELAY, CUSTOM_FUNCTIONS);

const app = express();
app.disable('x-powered-by');
app.use(expressCors());
app.use(expressMorgan('dev'));
app.use(expressBodyParser.json());

app.use('/graphql', expressGraphQL({
  schema: defaultSchema.schema,
  context: {environment: 'default'},
  pretty: true,
  graphiql: true,
}));

const server = app.listen(SERVICE_PORT, () => console.log(`
  GraphQL server listen on port ${server.address().port}
  GraphiQL - http://127.0.0.1:${server.address().port}/graphql
`));
```
