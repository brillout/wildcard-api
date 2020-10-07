import { assertUsage } from "@brillout/assert";
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import { wildcardServer as wildcardServer_ } from "./index";
import { ContextObject, UniversalAdapter } from "./WildcardServer";

export { MiddlewareFactory };

function MiddlewareFactory(
  ServerAdapter,
  __INTERNAL_universalAdapter: UniversalAdapter,
  adapterOptions?: object
) {
  return (
    setContext,
    {
      __INTERNAL_wildcardServer_middleware,
    }: { __INTERNAL_wildcardServer_middleware?: any } = {}
  ) => {
    return ServerAdapter(
      [
        async (requestObject: unknown, { requestProps }) => {
          const wildcardServer = __INTERNAL_wildcardServer_middleware
            ? __INTERNAL_wildcardServer_middleware.wildcardServer
            : wildcardServer_;

          if (
            !__INTERNAL_wildcardServer_middleware &&
            Object.keys(wildcardServer.endpoints).length === 0
          ) {
            autoLoadEndpointFiles();
          }

          const responseProps = await wildcardServer.getApiHttpResponse(
            requestProps,
            getContext,
            __INTERNAL_universalAdapter
          );

          return responseProps;

          async function getContext(): Promise<ContextObject> {
            let context: ContextObject;
            if (setContext) {
              context = await setContext(requestObject);
            }
            return context;
          }
        },
      ],
      adapterOptions
    );
  };
}
