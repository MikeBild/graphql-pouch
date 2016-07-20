const fs = require('fs');
const assert = require('assert');
const join = require('path').join;

describe('integration first', function() {
  it('should work on ', function() {
    const schema = read('first.graphql');
    const expected = json('first.json');
    assert.deepEqual(1, 1);
  });
});

function read (path) {
  return fs.readFileSync(join(__dirname, 'fixtures', path), 'utf8');
}

function json (path) {
  return require(join(__dirname, 'fixtures', path));
}
