const ExpressAdapter = require('@universal-adapter/express');
const {getApiResponse} = require('@wildcard-api/server');

module.exports = contextGetter => (
  new ExpressAdapter([
    async (req, {requestProps}) => {
      const context = await contextGetter(req);
      const responseProps = await getApiResponse(requestProps, context);
      return responseProps;
    }
  ])
);
