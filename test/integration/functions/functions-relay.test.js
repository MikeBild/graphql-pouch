const fs = require('fs');
const path = require('path');
const assert = require('assert');

const helper = require('../../helper');
const pouch = require('../../../lib/pouch-graphql/pouchdb');
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
      clientMutationId: input.input.clientMutationId,
      id: input.input.id,
      msg: `A`,
    });
  },
  upsertFoo: (ctx, input) => {
    const newDoc = {
      _id: input.input.id,
      _rev: input.input.rev,
      msg: input.input.msg,
    };
    ctx.pouchdb('function-relay-tests')
      .put(newDoc)
      .then(data => Object.assign(newDoc, data, {clientMutationId: input.input.clientMutationId}))
      .then(ctx.success);
  },
};
const SCHEMA_DEFINITION = `
type MyData {
  id: ID!
  msg: String
}

type Foo implements Node {
  id: ID!
  rev: String
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
  const db = pouch.createPouchDB(ENVIRONMENT);
  const sut = graphqlPouch(ENVIRONMENT, SCHEMA_DEFINITION, ENABLE_RELAY, CUSTOM_FUNCTIONS);

  /*
    Also note that in Web SQL, the database will not really be destroyed – it will just have its tables dropped.
    This is because Web SQL does not support true database deletion.
  */
  after(() => db.destroy());

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

  it('override upsert mutation with PouchDB', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-upsert-override-pouch.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-upsert-override-pouch.graphql`);
    const variableValues = null;

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

});
