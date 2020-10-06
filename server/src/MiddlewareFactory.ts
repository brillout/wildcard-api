import { assertUsage } from "@brillout/assert";
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import { wildcardServer as wildcardServer_ } from "./index";
import { UniversalAdapter } from "./WildcardServer";

export { MiddlewareFactory };

function MiddlewareFactory(
  ServerAdapter,
  __INTERNAL_universalAdapter: UniversalAdapter,
  adapterOptions?: object
) {
  return (
    contextGetter,
    {
      __INTERNAL_wildcardServer_middleware,
    }: { __INTERNAL_wildcardServer_middleware?: any } = {}
  ) => {
    return ServerAdapter(
      [
        async (requestObject, { requestProps }) => {
          const wildcardServer = __INTERNAL_wildcardServer_middleware
            ? __INTERNAL_wildcardServer_middleware.wildcardServer
            : wildcardServer_;
          if (
            !__INTERNAL_wildcardServer_middleware &&
            Object.keys(wildcardServer.endpoints).length === 0
          ) {
            autoLoadEndpointFiles();
          }
          let context;
          if (contextGetter) {
            context = await contextGetter(requestObject);
            assertUsage(
              context,
              "Your context getter should return an object but it returns `" +
                context +
                "`."
            );
            assertUsage(
              context instanceof Object,
              "Your context getter should return an object but it returns `context.constructor===" +
                context.constructor.name +
                "`."
            );
          }
          const responseProps = await wildcardServer.getApiHttpResponse(
            requestProps,
            context,
            __INTERNAL_universalAdapter
          );
          return responseProps;
        },
      ],
      adapterOptions
    );
  };
}
