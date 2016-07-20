const uuid = require('node-uuid');

module.exports = (ctx, input) => {
  //Logging to output
  ctx.log(input);

  //Using PouchDB within your functions
  ctx.pouchdb('cms')
    .allDocs({include_docs: true})
    .then(data => {
      return ctx.success({
        msg: 'All documents from CMS schema loaded.',
        docs: data.rows.map(x => x.doc),
        myId: uuid.v1()
      });
    });
};
