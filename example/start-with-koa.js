const assert = require('@brillout/reassert');
const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');
const {getApiResponse} = require('wildcard-api');
const bodyParser = require('koa-bodyparser');

require('./api/endpoints');

const app = new Koa();

app.use(bodyParser());

const router = new Router();

router.all('/wildcard/*', async ctx => {
  assert.internal(ctx.url);
  assert.internal(ctx.method);
  assert.internal('body' in ctx.request);
  assert.internal(ctx.method!=='POST' || ctx.request.body.constructor===Array);
  assert.internal(ctx.request.headers.constructor===Object);

  const requestProps = {
    url: ctx.url,
    method: ctx.method,
    body: ctx.request.body,
    headers: ctx.request.headers,
  };

  const responseProps = await getApiResponse(requestProps);

  ctx.status = responseProps.statusCode;
  ctx.body = responseProps.body;
  ctx.type = responseProps.contentType;
});

app.use(router.routes());

app.use(Static('client/dist', {extensions: ['.html']}));

app.listen(3000);

console.log('Server is running, go to http://localhost:3000')
