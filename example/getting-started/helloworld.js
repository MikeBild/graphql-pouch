// Hello World example

// HTTP API
// http://localhost:3000/api/helloworld?name=joe

module.exports = (ctx, args, parent) => {
  // Is authenticated via JWT
  if(!ctx.context.user) return ctx.failure(new Error(401));

  ctx.success({
    args: args,
    context: ctx.context,
    msg: 'Hello World!',
  });
};
