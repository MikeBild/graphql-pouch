const url = require('url');
const _ = require('lodash');
const fetch = require('node-fetch');
const PouchDB = require('pouchdb');
const logout = require('../../logout')();
PouchDB.plugin(require('pouchdb-adapter-node-websql'));
PouchDB.plugin(require('pouchdb-find'));

module.exports = {
  createPouchDB: _.memoize(createPouchDB),
  sync: _.memoize(sync),
};

function createPouchDB(environment){
  return new PouchDB(`${environment}.db`, {adapter: 'websql', auto_compaction: true});
}

function sync(environment, syncDbUrl, continuous_sync){
  if(!environment) return;
  if(!syncDbUrl) return;

  const syncDbUri = url.parse(syncDbUrl);
  const syncDbNamedUrl = ((!syncDbUri.path) || (syncDbUri.path === '/'))
          ? url.resolve(syncDbUrl, environment)
          : url.resolve(syncDbUrl.replace(syncDbUri.path, ''), `${syncDbUri.path.replace(/\//g, '')}-${environment}`);

  return fetch(syncDbNamedUrl, {method: 'PUT'})
    .catch(error => error)
    .then(data => data.json())
    .then(data => {
      return createPouchDB(environment)
        .sync(syncDbNamedUrl, {
          live: continuous_sync,
          retry: continuous_sync,
        })
        .on('change', info => logout.log(`Change - ${syncDbUri.host} - ${environment}`))
        .on('paused', () => logout.log(`Paused - ${syncDbUri.host} - ${environment}`))
        .on('active', () => logout.log(`Active - ${syncDbUri.host} - ${environment}`))
        .on('denied', info => logout.error(`Denied - ${syncDbUri.host} - ${environment}`))
        .on('complete', info => logout.log(`Complete - ${syncDbUri.host} - ${environment}`))
        .on('error', error => logout.error(`Error - ${syncDbUri.host} - ${environment}`));
    })
    .catch(error => logout.error(error));
}
