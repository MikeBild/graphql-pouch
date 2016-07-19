const uuid = require('node-uuid');
module.exports = (ctx, data) => {
  ctx.log(data);
  ctx.pouchdb('cms')
    .allDocs({include_docs: true})
    .then(data => {
      return ctx.success({
        msg: 'my demo lambda function 3 success message',
        docs: data.rows.map(x => x.doc),
        myId: uuid.v1()
      });
    });
};
