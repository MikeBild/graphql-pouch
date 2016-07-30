const fs = require('fs');
const path = require('path');
const assert = require('assert');

const helper = require('../../helper');
const graphqlPouch = require('../../../lib/pouch-graphql');

const ENVIRONMENT = 'function-relay-tests';
const USER = {};
const TEST_FIXTURES = 'test/integration/functions/fixtures-relay';
const ENABLE_RELAY = true;
const CUSTOM_FUNCTIONS = {
  doSomething: (ctx, input) => {
    ctx.success({
      msg: 'A'
    });
  },
  doSomethingFor: (ctx, input) => {
    ctx.success({
      msg: `A${input.id}`
    });
  },
  doSomethingWith: (ctx, input) => {
    ctx.success({
      msg: `A${input.input.aParam}`
    });
  },
  allMyDatas: (ctx, input) => {
    ctx.success([{
      msg: `A`
    }]);
  },
  upsertMyData: (ctx, input) => {
    ctx.success({
      id: input.input.id,
      msg: `A`,
    });
  },
};
const SCHEMA_DEFINITION = `
type MyData {
  id: ID!
  msg: String
}

input MyInput {
  aParam: String
}

type Query {
  doSomething(): MyData
  doSomethingFor(id: ID): MyData
  doSomethingWith(input: MyInput): MyData
}
`;

describe('Custom functions integration (relay)', function() {

  it('override upsert mutation', () => {
    const sut = graphqlPouch(ENVIRONMENT, SCHEMA_DEFINITION, ENABLE_RELAY, CUSTOM_FUNCTIONS);
    const expectedData = helper.json(`${TEST_FIXTURES}/function-upsert-override.json`);

    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-upsert-override.graphql`);
    const variableValues = null;

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

});
