const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

// TODO:
//  - intercept errors for onNewEndpointResult
require('wildcard-api').onNewEndpointResult = ({endpointName, endpointResult}) => {
  console.log("on new");
  console.log(endpointName, endpointResult);
  return endpointResult;
};

const app = new Koa();

const router = new Router();

router.all('/wildcard/*', async (ctx, next) => {
  const {method, url, headers} = ctx;
  const context = {method, url, headers};

  const apiResponse = await getApiResponse(context);

  ctx.status = apiResponse.statusCode;
  ctx.type = apiResponse.type;
  ctx.body = apiResponse.body;
});

app.use(router.routes());

app.use(Static('client/dist', {extensions: ['.html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
