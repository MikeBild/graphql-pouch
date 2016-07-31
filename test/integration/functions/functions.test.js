const assert = require('assert');

const helper = require('../../helper');
const pouch = require('../../../lib/pouch-graphql/pouchdb');
const graphqlPouch = require('../../../lib/pouch-graphql');

const ENVIRONMENT = 'function-tests';
const USER = {};
const TEST_FIXTURES = 'test/integration/functions/fixtures';
const ENABLE_RELAY = false;
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

describe('Custom functions integration (no-relay)', function() {
  const db = pouch.createPouchDB(ENVIRONMENT);
  const sut = graphqlPouch(ENVIRONMENT, SCHEMA_DEFINITION, ENABLE_RELAY, CUSTOM_FUNCTIONS);
  /*
    Also note that in Web SQL, the database will not really be destroyed – it will just have its tables dropped.
    This is because Web SQL does not support true database deletion.
  */
  after(() => db.destroy());

  it('simple', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-simple.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-simple.graphql`);
    const variableValues = null;

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

  it('simple input parameter', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-parameter-simple.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-parameter-simple.graphql`);
    const variableValues = null;

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

  it('complex input parameter', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-parameter-complex.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-parameter-complex.graphql`);
    const variableValues = null;

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

  it('complex input parameter as variable values', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-parameter-complex-variable.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-parameter-complex-variable.graphql`);
    const variableValues = {
      "input": {
        "aParam": "Bar"
      }
    };

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

  it('override all query', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-all-override.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-all-override.graphql`);
    const variableValues = null;

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

  it('override upsert mutation', () => {
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
