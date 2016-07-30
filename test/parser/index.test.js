const fs = require('fs');
const path = require('path');
const assert = require('assert');

const helper = require('../helper');
const parse = require('../../lib/pouch-graphql/parse');

describe('Parser', () => {

  it('should work on the kitchen sink', () => {
    const schema = helper.read('test/parser/fixtures/schema.graphql');
    const expected = helper.json('test/parser/fixtures/schema.json');
    assert.deepEqual(parse(schema), expected);
  });

});
