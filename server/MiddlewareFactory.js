module.exports = MiddlewareFactory;

function MiddlewareFactory(ServerAdapter, opts) {
  return (
    (contextGetter, {wildcardApi}) => {
      wildcardApi = wildcardApi || require('@wildcard-api/server');
      return (
        ServerAdapter(
          [ async (requestObject, {requestProps}) => {
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
