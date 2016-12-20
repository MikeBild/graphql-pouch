const PouchDB = require('./pouchdb');
const uuid = require('uuid');
const utils = require('./utils');

module.exports = {
  resolveNode: resolveNode,
  resolveConnection: resolveConnection,
  resolveListOrSingle: resolveListOrSingle,
  resolveByParentId: resolveByParentId,
  resolveUpsert: resolveUpsert,
  resolveDelete: resolveDelete,
  resolveSubscription: resolveSubscription,
};

function resolveNode(environment, guid){
  // console.dir(`Node resolver for ${guid} on schema ${environment}`);
  return PouchDB.createPouchDB(environment)
    .get(guid)
    .then(doc => {
      doc.id = doc._id;
      doc.rev = doc._rev;
      delete doc._id;
      delete doc._rev;
      return doc;
    })
    .catch(error => null);
}

function resolveConnection(parent, args, ctx, info, typeName){
  // console.dir(`Connection resolver for ${typeName} on schema ${ctx.environment}`);
  const selector = {selector:{doctype:typeName}};
  const filter = {};

  if(args.first) selector.limit = parseInt(args.first);
  if(args.after) selector.skip = parseInt(args.after);
  selector.skip = selector.skip || 0;

  if(args.selector && args.selector.filter){
    try { filter = JSON.parse(args.selector.filter); } catch(error) { console.dir(error); }
  }
  if(filter) selector.selector = Object.assign(selector.selector, filter);
  if(filter && args.selector && args.selector.sort) selector.sort = args.selector.sort;

  return PouchDB.createPouchDB(ctx.environment)
    .find(selector)
    .then(data => {
      const result = {};
      result.pageInfo = {
        hasNextPage: data.docs.length !== 0 || data.docs.length < selector.skip,
        hasPreviousPage: selector.skip > 1,
        startCursor: (selector.skip+1) || 1,
        endCursor: (selector.skip + data.docs.length) || data.docs.length
      };
      if(result.pageInfo.startCursor > result.pageInfo.endCursor
          || data.docs.length < selector.limit)
        result.pageInfo.startCursor = result.pageInfo.endCursor;

      if(result.pageInfo.startCursor === result.pageInfo.endCursor) result.pageInfo.hasNextPage = false;
      result.edges = data.docs.map((x, i) => {
        x.id = x._id;
        x.rev = x._rev;
        delete x._id;
        delete x._rev;
        return {
          cursor: selector.skip + i + 1,
          node: x
        };
      });
      return result;
    });
}

function resolveByParentId(parent, args, ctx, info, typeName) {
  // console.dir(`Parent resolver for ${typeName} on schema ${ctx.environment}`);
  if(!parent[info.fieldName+'Id']){
    // console.dir(`Relation field value for ${info.fieldName+'Id'} in ${parent.doctype} not found`)
    return Promise.reject(new Error(`Relation field value for ${info.fieldName+'Id'} in ${parent.doctype} not found`));
  }

  return PouchDB.createPouchDB(ctx.environment)
    .get(parent[info.fieldName+'Id'])
    .then(x => {
      x.id = x._id;
      x.rev = x._rev;
      delete x._id;
      delete x._rev;
      return x;
    });
}

function resolveListOrSingle(parent, args, ctx, info, typeName) {
  // console.dir(`List or single resolver for ${typeName} on schema ${ctx.environment}`);
  // Do not resolve via PouchDB. All values exists in parent.
  if(parent && info.fieldName && parent[info.fieldName]) return Promise.resolve(parent[info.fieldName]);
  if(parent && info.fieldName && parent[info.fieldName+'Ids']) {
    return PouchDB.createPouchDB(ctx.environment)
      .bulkGet({ docs: (parent[info.fieldName+'Ids'] || []).map(x => ({id: x}))})
      .then(x => {
        const results = x.results.reduce((state, x) => {
          return state.concat((x.docs || []).map(x => x.ok))
        }, []);

        results.forEach(x => {
          x.id = x._id;
          x.rev = x._rev;
          delete x._id;
          delete x._rev;
        });

        return results;
      });
  }

  if(args.id) {
    return PouchDB.createPouchDB(ctx.environment)
      .get(args.id)
      .then(x => {
        x.id = x._id;
        x.rev = x._rev;
        delete x._id;
        delete x._rev;
        return x;
      });
  }

  const filter = {};
  const selector = {selector:{doctype:typeName}};

  if(parent && parent.id) selector.selector[utils.lowerCaseFirstLetter(info.parentType.name)+'Id'] = parent.id;
  if(args.id) selector.selector.docId = args.id;

  if(args.selector && args.selector.first) selector.limit = args.selector.first;
  if(args.selector && args.selector.after) selector.skip = args.selector.after;
  if(args.selector && args.selector.fields) selector.fields = args.selector.fields;

  if(args.selector && args.selector.filter){
    try { filter = JSON.parse(args.selector.filter); } catch(error) { console.dir(error); }
  }
  if(filter) selector.selector = Object.assign(selector.selector, filter);
  if(filter && args.selector && args.selector.sort) selector.sort = args.selector.sort;

  return PouchDB.createPouchDB(ctx.environment)
    .find(selector)
    .then(data => {
      return data.docs.map(x => {
        x.id = x._id;
        x.rev = x._rev;
        delete x._id;
        delete x._rev;
        return x;
      });
    });
}

function resolveUpsert(parent, args, ctx, info, typeName) {
  // console.dir(`Upsert mutation for ${typeName} on schema ${ctx.environment}`);
  const clientMutationId = (args && args.input && args.input.clientMutationId) ? args.input.clientMutationId : undefined;
  args.input.doctype = typeName;
  args.input.docid = args.input.id || uuid.v1();
  args.input._id = args.input.docid;
  args.input._rev = args.input.rev;

  delete args.input.clientMutationId;
  delete args.input.id;
  delete args.input.rev;

  return PouchDB.createPouchDB(ctx.environment)
    .put(args.input)
    .then(doc => PouchDB.createPouchDB(ctx.environment).get(doc.id))
    .then(doc => {
      doc.id = doc._id;
      doc.rev = doc._rev;
      if(clientMutationId) doc.clientMutationId = clientMutationId;
      delete doc._id;
      delete doc._rev;
      return doc;
    });
}

function resolveDelete(parent, args, ctx, info, typeName) {
  // console.dir(`Delete mutation for ${typeName} by id ${args.id} on schema ${ctx.environment}`);
  return PouchDB.createPouchDB(ctx.environment)
    .get(args.id || args.input.id)
    .then(doc => {
      return PouchDB.createPouchDB(ctx.environment)
        .remove(doc._id, doc._rev)
        .then(_ => {
          if(args && args.input && args.input.clientMutationId) doc.clientMutationId = args.input.clientMutationId;
          doc.id = doc._id;
          doc.rev = doc._rev;
          delete doc._id;
          delete doc._rev;
          return doc;
        });
    });
}

function resolveSubscription(parent, args, ctx, info, typeName) {
  console.log('-------------------- Subscriptions Resolver -----------------------------')
  console.log(parent)
  console.log(args)
  console.log(ctx)
  console.log(info)
  console.log(typeName)
}
