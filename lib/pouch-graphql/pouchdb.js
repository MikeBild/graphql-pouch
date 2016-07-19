const _ = require('lodash');
const PouchDB = require('pouchdb');
require('pouchdb/extras/websql');
PouchDB.plugin(require('pouchdb-find'));

module.exports = {
  createPouchDB: _.memoize(createPouchDB),
  sync: sync
};

function createPouchDB(schemaName){
  return new PouchDB(schemaName+'.db', {adapter: 'websql', auto_compaction: true});
}

function sync(name, couchURL, continuous_sync){
  if(!name) return;
  if(!couchURL) return;

  const couchDBNamedUrl = couchURL+'/'+name;
  return createPouchDB(name).sync(couchDBNamedUrl, {
      live: continuous_sync,
      retry: continuous_sync
    }).on('change', info => {
      console.log(`Change to ${couchDBNamedUrl}`);
    }).on('paused', () => {
      // console.log(`Pause/Offline to ${couchDBNamedUrl}`);
    }).on('active', () => {
      // console.log(`Active/Online to ${couchDBNamedUrl}`);
    }).on('denied', info => {
      // console.log(`Denied to ${couchDBNamedUrl}`);
      // console.log(info);
    }).on('complete', info => {
      console.log(`Complete to ${couchDBNamedUrl}`);
      // console.log(info);
    }).on('error', error => {
      console.log(`Error to ${couchDBNamedUrl}`);
      // console.log(error);
    });
}