import assert = require("@brillout/assert");
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import { wildcardApi as wilcardApi_ } from "./index";

export { MiddlewareFactory };

function MiddlewareFactory(ServerAdapter, opts?) {
  return (contextGetter, { __INTERNAL__wildcardApiHolder }: {__INTERNAL__wildcardApiHolder?: any}  = {}) => {
    return ServerAdapter(
      [
        async (requestObject, { requestProps }) => {
          const wildcardApi = __INTERNAL__wildcardApiHolder
            ? __INTERNAL__wildcardApiHolder.wildcardApi
            : wilcardApi_;
          if (
            !__INTERNAL__wildcardApiHolder &&
            Object.keys(wildcardApi.endpoints).length === 0
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
          const responseProps = await wildcardApi.getApiHttpResponse(
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
