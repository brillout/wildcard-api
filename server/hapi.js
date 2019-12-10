const HapiAdapter = require('@universal-adapter/hapi');
const {getApiResponse} = require('@wildcard-api/server');

module.exports = contextGetter => (
  new HapiAdapter([
    async (request, {requestProps}) => {
      const context = await contextGetter(request);
      const responseProps = await getApiResponse(requestProps, context);
      return responseProps;
    }
  ], {path: '/wildcard/{param*}'})
);
