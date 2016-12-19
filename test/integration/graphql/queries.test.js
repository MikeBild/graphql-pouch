const fs = require('fs');
const path = require('path');
const assert = require('assert');

const helper = require('../../helper');
const pouch = require('../../../lib/pouch-graphql/pouchdb');
const graphqlPouch = require('../../../lib/pouch-graphql');

const ENVIRONMENT = 'query-tests';
const USER = {};
const TEST_FIXTURES = 'test/integration/graphql/fixtures';
const ENABLE_RELAY = false;
const CUSTOM_FUNCTIONS = [];
const SCHEMA_DEFINITION = `
type Post {
  id: ID
  rev: String
  title: String
  body: String
  personId: ID
  person: Person
  tagsIds: [ID]
  tags: [Tag]
}

type Comment {
  id: ID
  rev: String
  title: String
  personId: ID
  person: Person
  postId: ID
  post: Post
  tagsIds: [ID]
  tags: [Tag]
}

type Person {
  id: ID
  rev: String
  name: String
}

type Tag {
  id: ID
  value: String
}
`;

describe('GraphQL query integration (no-relay)', () => {
  const db = pouch.createPouchDB(ENVIRONMENT);
  const sut = graphqlPouch(ENVIRONMENT, SCHEMA_DEFINITION, ENABLE_RELAY, CUSTOM_FUNCTIONS);

  before(() => {
    const post1 = {
      doctype: 'Post',
      _id: 'test1',
      title: 'title 1',
      body: 'body 1',
      personId: 'joe',
      tagsIds: ['a1', 'b1'],
    };
    const post2 = {
      doctype: 'Post',
      _id: 'test2',
      title: 'title 2',
      body: 'body 2',
      personId: 'joe',
      tagsIds: ['a1'],
    };
    const post3 = {
      doctype: 'Post',
      _id: 'test3',
      title: 'title 3',
      body: 'body 3',
      personId: 'joe',
      tagsIds: [],
    };
    const post4 = {
      doctype: 'Post',
      _id: 'test4',
      title: 'title 4',
      body: 'body 4',
      personId: 'jay',
    };
    const personJoe = {
      doctype: 'Person',
      _id: 'joe',
      name: 'John Doe',
    };
    const personJay = {
      doctype: 'Person',
      _id: 'jay',
      name: 'Jane Doe',
    };
    const tagA1 = {
      doctype: 'Tag',
      _id: 'a1',
      value: 'A1',
    };
    const tagB1 = {
      doctype: 'Tag',
      _id: 'b1',
      value: 'B1',
    };

    return db.bulkDocs([
      post1,
      post2,
      post3,
      post4,
      personJoe,
      personJay,
      tagA1,
      tagB1,
    ]);
  });

  /*
    Also note that in Web SQL, the database will not really be destroyed – it will just have its tables dropped.
    This is because Web SQL does not support true database deletion.
  */
  after(() => db.destroy());

  fs.readdirSync(TEST_FIXTURES).forEach(fileName => {
    if(path.extname(fileName) === '.graphql') {
      const testName = path.basename(fileName, '.graphql');

      it(`GraphQL query ${testName}`, () => {
        const expectedData = helper.json(`${TEST_FIXTURES}/${testName}.json`);
        const operationName = null;
        const rootValue = null;
        const contextValue = {environment: ENVIRONMENT, user: USER};
        const schemaQuery = helper.read(`${TEST_FIXTURES}/${testName}.graphql`);
        const variableValues = null;

        return sut
          .query(schemaQuery, variableValues, rootValue, contextValue, operationName)
          .then(result => assert.deepEqual(result, expectedData));
      });
    }
  });

});
