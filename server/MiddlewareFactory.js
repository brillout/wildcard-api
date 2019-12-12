const assert = require('@brillout/assert');

module.exports = MiddlewareFactory;

function MiddlewareFactory(ServerAdapter, opts) {
  return (
    (contextGetter, args) => {
      return (
        ServerAdapter(
          [ async (requestObject, {requestProps}) => {
            const wildcardApi = (args||{}).wildcardApi || require('@wildcard-api/server');
            assert.usage(
              contextGetter,
              'You need to pass a context getter to the Wildcard middleware.',
            );
            const context = await contextGetter(requestObject);
            assert.usage(
              context,
              'Your context getter should return an object but it returns `'+context+'`.',
            );
            assert.usage(
              context instanceof Object,
              {context},
              'Your context getter should return an object but it returns `context.constructor==='+context.constructor.name+'`.',
            );
            const responseProps = await wildcardApi.getApiResponse(requestProps, context);
            return responseProps;
          } ],
          opts,
        )
      );
    }
  );
}
