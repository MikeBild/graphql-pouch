const fs = require('fs');
const path = require('path');

module.exports = {
  read: read,
  json: json,
};

function read (filePath) {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

function json (filePath) {
  return require(path.join(process.cwd(), filePath));
}
