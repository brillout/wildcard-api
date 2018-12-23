const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = new Koa();

const router = new Router();

router.all('/wildcard/*', async (ctx, next) => {
  const {method, url, headers} = ctx;
  const context = {method, url, headers};

  const apiResponse = await getApiResponse(context);

  ctx.status = apiResponse.statusCode;
  ctx.body = apiResponse.body;
});

app.use(router.routes());

app.use(Static('client/dist'));

app.listen(process.env.PORT || 3000);
