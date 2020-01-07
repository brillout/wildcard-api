const assert = require('@brillout/assert');
const autoLoadEndpointFiles = require('./autoLoadEndpointFiles');

module.exports = MiddlewareFactory;

function MiddlewareFactory(ServerAdapter, opts) {
  return (
    (contextGetter, args) => {
      return (
        ServerAdapter(
          [ async (requestObject, {requestProps}) => {
            let wildcardApi = (args||{}).wildcardApi;
            if( !wildcardApi ){
              wildcardApi =  require('@wildcard-api/server');
              if( Object.keys(wildcardApi.endpoints).length===0 ){
                autoLoadEndpointFiles();
              }
            }
            /*
            assert.usage(
              contextGetter,
              'You need to pass a context getter to the Wildcard middleware.',
            );
            */
            let context;
            if( contextGetter ){
              context = await contextGetter(requestObject);
              assert.usage(
                context,
                'Your context getter should return an object but it returns `'+context+'`.',
              );
              assert.usage(
                context instanceof Object,
                {context},
                'Your context getter should return an object but it returns `context.constructor==='+context.constructor.name+'`.',
              );
            }
            const responseProps = await wildcardApi.getApiHttpResponse(requestProps, context);
            return responseProps;
          } ],
          opts,
        )
      );
    }
  );
}
