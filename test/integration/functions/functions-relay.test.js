const assert = require('assert');

const helper = require('../../helper');
const pouch = require('../../../lib/pouch-graphql/pouchdb');
const graphqlPouch = require('../../../lib/pouch-graphql');

const ENVIRONMENT = 'function-relay-tests';
const USER = {};
const TEST_FIXTURES = 'test/integration/functions/fixtures-relay';
const ENABLE_RELAY = true;
const CUSTOM_FUNCTIONS = {
  doSomething: (ctx, args, parent) => {
    ctx.success({
      msg: 'A'
    });
  },
  doSomethingFor: (ctx, args, parent) => {
    ctx.success({
      msg: `A${args.id}`
    });
  },
  doSomethingWith: (ctx, args, parent) => {
    ctx.success({
      msg: `A${args.input.aParam}`
    });
  },
  allMyDatas: (ctx, args, parent) => {
    ctx.success([{
      msg: `A`
    }]);
  },
  upsertMyData: (ctx, args, parent) => {
    ctx.success({
      clientMutationId: args.input.clientMutationId,
      id: args.input.id,
      msg: `A`,
    });
  },
  upsertFoo: (ctx, args, parent) => {
    const newDoc = {
      _id: args.input.id,
      _rev: args.input.rev,
      msg: args.input.msg,
    };
    ctx.pouchdb('function-relay-tests')
      .put(newDoc)
      .then(data => Object.assign(newDoc, data, {clientMutationId: args.input.clientMutationId}))
      .then(ctx.success);
  },
};
const SCHEMA_DEFINITION = `
type MyData implements Node {
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
