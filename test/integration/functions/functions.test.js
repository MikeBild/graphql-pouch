const assert = require('assert');

const helper = require('../../helper');
const pouch = require('../../../lib/pouch-graphql/pouchdb');
const graphqlPouch = require('../../../lib/pouch-graphql');

const ENVIRONMENT = 'function-tests';
const USER = {};
const TEST_FIXTURES = 'test/integration/functions/fixtures';
const ENABLE_RELAY = false;
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
  allParentDatas: (ctx, args, parent) => {
    ctx.success([{
      id: '1',
      msg: `Parent A`,
    }]);
  },
  childs: (ctx, args, parent) => {
    ctx.success([{
      id: '1',
      msg: `Child A`,
      parentId: parent.id,
    }, {
      id: '2',
      msg: `Child B`,
      parentId: parent.id,
    }]);
  },
  child: (ctx, args, parent) => {
    ctx.success({
      id: '2',
      msg: `Child B`,
      parentId: parent.id,
    });
  },
  upsertParentData: (ctx, args, parent) => {
    ctx.success({
      id: args.input.id,
      msg: `A`,
    });
  },
};
const SCHEMA_DEFINITION = `
type ParentData {
  id: ID!
  msg: String
  childs: [ChildData]
  child: ChildData
}

type ChildData {
  id: ID!
  msg: String
  parentId: ID
}

input MyInput {
  aParam: String
}

type Query {
  doSomething(): ParentData
  doSomethingFor(id: ID): ParentData
  doSomethingWith(input: MyInput): ParentData
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

  it('override allXYZ resolver query', () => {
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

  it('override child-node resolver query', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-child-node-override.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-child-node-override.graphql`);
    const variableValues = null;

    return sut
      .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
      .then(result => assert.deepEqual(result, expectedData));
  });

  it('override child-node list resolver query', () => {
    const expectedData = helper.json(`${TEST_FIXTURES}/function-child-node-list-override.json`);
    const operationName = null;
    const rootValue = null;
    const contextValue = {environment: ENVIRONMENT, user: USER};
    const schemaQuery = helper.read(`${TEST_FIXTURES}/function-child-node-list-override.graphql`);
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
