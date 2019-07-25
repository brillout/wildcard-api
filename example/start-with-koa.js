const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = new Koa();

const router = new Router();

router.all('/wildcard/*', async ctx => {
  const requestProps = {
    url: ctx.url,
    method: ctx.method,
    body: ctx.body,
    // All requestProps are available to your endpoint functions as `this`.
    // For example, if you want to access the HTTP request headers in your endpoint functions:
    //    requestProps.headers = ctx.headers;
  };
  const responseProps = await getApiResponse(requestProps);
  ctx.status = responseProps.statusCode;
  ctx.body = responseProps.body;
  ctx.type = responseProps.contentType;
});

app.use(router.routes());

app.use(Static('client/dist', {extensions: ['.html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
