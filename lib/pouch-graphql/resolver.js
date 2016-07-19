const PouchDB = require('./pouchdb');
const uuid = require('node-uuid');

module.exports = {
  resolveNode: resolveNode,
  resolveConnection: resolveConnection,
  resolveListOrSingle: resolveListOrSingle,
  resolveByParentId: resolveByParentId,
  resolveUpsert: resolveUpsert,
  resolveDelete: resolveDelete,
};

function resolveNode(schemaName, guid){
  // console.dir(`Node resolver for ${guid} on schema ${schemaName}`);
  return PouchDB.createPouchDB(schemaName)
    .get(guid)
    .then(doc => {
      doc.id = doc._id;
      doc.rev = doc._rev;
      delete doc._id;
      delete doc._rev;
      return doc
    })
    .catch(error => null);
}

function resolveConnection(parent, args, ctx, info, typeName){
  // console.dir(`Connection resolver for ${typeName} on schema ${ctx.schemaName}`);
  let selector = {selector:{doctype:typeName}};
  let filter = {};

  if(args.first) selector.limit = parseInt(args.first);
  if(args.after) selector.skip = parseInt(args.after);
  selector.skip = selector.skip || 0;

  if(args.selector && args.selector.filter){
    try { filter = JSON.parse(args.selector.filter); } catch(error) { console.dir(error); }
  }
  if(filter) selector.selector = Object.assign(selector.selector, filter);
  if(filter && args.selector && args.selector.sort) selector.sort = args.selector.sort;

  return PouchDB.createPouchDB(ctx.schemaName)
    .find(selector)
    .then(data => {
      let result = {};
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
  // console.dir(`Parent resolver for ${typeName} on schema ${ctx.schemaName}`);
  if(!parent[info.fieldName+'Id']){
    // console.dir(`Relation field value for ${info.fieldName+'Id'} in ${parent.doctype} not found`)
    return Promise.reject(new Error(`Relation field value for ${info.fieldName+'Id'} in ${parent.doctype} not found`));
  }

  return PouchDB.createPouchDB(ctx.schemaName)
    .get(parent[info.fieldName+'Id'])
    .then(x => {
      x.id = x._id;
      x.rev = x._rev;
      delete x._id;
      delete x._rev;
      return x
    });
}

function resolveListOrSingle(parent, args, ctx, info, typeName) {
  //console.dir(`List or single resolver for ${typeName} on schema ${ctx.schemaName}`);

  if(args.id) {
    return PouchDB.createPouchDB(ctx.schemaName)
      .get(args.id)
      .then(x => {
        x.id = x._id;
        x.rev = x._rev;
        delete x._id;
        delete x._rev;
        return x
      });
  }

  let filter = {};
  let selector = {selector:{doctype:typeName}};

  if(parent && parent.id) selector.selector[info.parentType.name.toLowerCase()+'Id'] = parent.id;
  if(args.id) selector.selector.docId = args.id;

  if(args.selector && args.selector.first) selector.limit = args.selector.first;
  if(args.selector && args.selector.after) selector.skip = args.selector.after;
  if(args.selector && args.selector.fields) selector.fields = args.selector.fields;

  if(args.selector && args.selector.filter){
    try { filter = JSON.parse(args.selector.filter); } catch(error) { console.dir(error); }
  }
  if(filter) selector.selector = Object.assign(selector.selector, filter);
  if(filter && args.selector && args.selector.sort) selector.sort = args.selector.sort;
  
  return PouchDB.createPouchDB(ctx.schemaName)
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
  //console.dir(`Upsert mutation for ${typeName} on schema ${ctx.schemaName}`);
  const clientMutationId = (args && args.input && args.input.clientMutationId) ? args.input.clientMutationId : undefined;
  args.input.doctype = typeName;
  args.input.docid = args.input.id || uuid.v1();
  args.input._id = args.input.docid;
  args.input._rev = args.input.rev;

  delete args.input.clientMutationId;
  delete args.input.id;
  delete args.input.rev;
  
  return PouchDB.createPouchDB(ctx.schemaName)
    .put(args.input)
    .then(doc => PouchDB.createPouchDB(ctx.schemaName).get(doc.id))
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
  //console.dir(`Delete mutation for ${typeName} by id ${args.id} on schema ${ctx.schemaName}`);
  return PouchDB.createPouchDB(ctx.schemaName)
    .get(args.id || args.input.id)
    .then(doc => {
      return PouchDB.createPouchDB(ctx.schemaName)
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