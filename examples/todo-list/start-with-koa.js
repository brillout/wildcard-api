const Koa = require('koa');
const Static = require('koa-static');
const wildcard = require('@wildcard-api/server/koa');

const app = new Koa();

// Server our API endpoints
app.use(wildcard(async ctx => {
  const {headers} = ctx.request;
  const context = {headers};
  return context;
}));

// Serve our frontend
app.use(Static('client/dist', {extensions: ['.html']}));

app.listen(3000);

console.log('Koa server is running, go to http://localhost:3000')
