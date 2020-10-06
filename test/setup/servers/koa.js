const Koa = require("koa");
const Static = require("koa-static");
const bodyParser = require("koa-bodyparser");
const { wildcard } = require("@wildcard-api/server/koa");
const { start, stop } = require("./express");

module.exports = startServer;

async function startServer({
  __INTERNAL_wildcardServer_middleware,
  httpPort,
  staticDir,
}) {
  const app = new Koa();

  app.use(bodyParser());

  app.use(
    wildcard(
      async (ctx) => {
        const { headers } = ctx.request;
        const context = { headers };
        return context;
      },
      { __INTERNAL_wildcardServer_middleware }
    )
  );

  app.use(Static(staticDir, { extensions: [".html"] }));

  // Not sure why `.callback()` is needed
  //  - Source: https://github.com/koajs/koa/pull/1102#issue-154979875
  const server = await start(app.callback(), httpPort);
  return () => stop(server);
}
