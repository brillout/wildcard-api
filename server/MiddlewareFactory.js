module.exports = MiddlewareFactory;

function MiddlewareFactory(ServerAdapter, opts) {
  return (
    (contextGetter, args) => {
      return (
        ServerAdapter(
          [ async (requestObject, {requestProps}) => {
            const wildcardApi = (args||{}).wildcardApi || require('@wildcard-api/server');
            const context = await contextGetter(requestObject);
            const responseProps = await wildcardApi.getApiResponse(requestProps, context);
            return responseProps;
          } ],
          opts,
        )
      );
    }
  );
}
