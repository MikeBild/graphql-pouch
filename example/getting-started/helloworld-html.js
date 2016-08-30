// Hello World HTML output example

// HTTP API
// http://localhost:3000/api/helloworld-html?name=Joe

module.exports = (ctx, args, parent) => {
  // Is authenticated via JWT
  // if(!ctx.context.user) return ctx.failure(new Error(401));

  ctx.success(`<h1>Hello ${args.name || 'World'}!</h1>`);
};
