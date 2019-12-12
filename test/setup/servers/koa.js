const Koa = require('koa');
const Static = require('koa-static');
const bodyParser = require('koa-bodyparser');
const wildcard = require('@wildcard-api/server/koa');

module.exports = startServer;

async function startServer({wildcardApiHolder, httpPort, staticDir}) {
  const app = new Koa();

  app.use(bodyParser());

  app.use(wildcard(
    async ctx => {
      const {headers} = ctx.request;
      const context = {headers};
      return context;
    },
    wildcardApiHolder,
  ));

  app.use(Static(staticDir, {extensions: ['.html']}));

  const server = app.listen(httpPort);
  return () => server.close();
};
