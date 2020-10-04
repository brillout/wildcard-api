import assert = require("@brillout/assert");
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import { wildcardServer as wildcardServer_ } from "./index";

export { MiddlewareFactory };

function MiddlewareFactory(ServerAdapter, opts?) {
  return (
    contextGetter,
    {
      __INTERNAL__wildcardServerHolder,
    }: { __INTERNAL__wildcardServerHolder?: any } = {}
  ) => {
    return ServerAdapter(
      [
        async (requestObject, { requestProps }) => {
          const wildcardServer = __INTERNAL__wildcardServerHolder
            ? __INTERNAL__wildcardServerHolder.wildcardServer
            : wildcardServer_;
          if (
            !__INTERNAL__wildcardServerHolder &&
            Object.keys(wildcardServer.endpoints).length === 0
          ) {
            autoLoadEndpointFiles();
          }
          let context;
          if (contextGetter) {
            context = await contextGetter(requestObject);
            assert.usage(
              context,
              "Your context getter should return an object but it returns `" +
                context +
                "`."
            );
            assert.usage(
              context instanceof Object,
              { context },
              "Your context getter should return an object but it returns `context.constructor===" +
                context.constructor.name +
                "`."
            );
          }
          const responseProps = await wildcardServer.getApiHttpResponse(
            requestProps,
            context
          );
          return responseProps;
        },
      ],
      opts
    );
  };
}
