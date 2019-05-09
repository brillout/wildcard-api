const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = new Koa();

const router = new Router();

router.all('/wildcard/*', async ctx => {
  const apiResponse = await getApiResponse(ctx);
  ctx.status = apiResponse.statusCode;
  ctx.type = apiResponse.type;
  ctx.body = apiResponse.body;
});

app.use(router.routes());

app.use(Static('client/dist', {extensions: ['.html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
