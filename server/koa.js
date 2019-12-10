const KoaAdapter = require('@universal-adapter/koa');
const {getApiResponse} = require('@wildcard-api/server');

module.exports = contextGetter => (
  new KoaAdapter([
    async (ctx, {requestProps}) => {
      const context = await contextGetter(ctx);
      const responseProps = await getApiResponse(requestProps, context);
      return responseProps;
    }
  ])
);
