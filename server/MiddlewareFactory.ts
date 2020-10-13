import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import { wildcardServer as wildcardServer_ } from "./global-instance";
import {
  Context,
  HttpRequestProps,
  HttpResponseProps,
  UniversalAdapterName,
  WildcardServer,
} from "./WildcardServer";

export { MiddlewareFactory };

type SetContext<HttpRequest> = (req: HttpRequest) => Promise<Context> | Context;

type ServerAdapterOptions = any & { _brand: "ServerAdapterOptions" };

type RequestHandlerArg1 = { requestProps: HttpRequestProps };
type RequestHandlerReturn = Promise<HttpResponseProps | null>;
type RequestHandler<HttpRequest> = (
  req: HttpRequest,
  arg1: RequestHandlerArg1
) => RequestHandlerReturn;

type ServerAdapter<ServerMiddleware, HttpRequest> = (
  arg0: RequestHandler<HttpRequest>[],
  arg1: ServerAdapterOptions
) => ServerMiddleware;

type WildcardServerHolder = {
  wildcardServer: WildcardServer;
};
type WildcardServerOption = {
  __INTERNAL_wildcardServer_middleware?: WildcardServerHolder;
};

function createMiddleware<ServerMiddleware, HttpRequest>(
  serverAdapter: ServerAdapter<ServerMiddleware, HttpRequest>,
  __INTERNAL_wildcardServer_middleware: WildcardServerHolder | undefined,
  adapterOptions: ServerAdapterOptions,
  setContext: SetContext<HttpRequest> | undefined,
  __INTERNAL_universalAdapter: UniversalAdapterName
): ServerMiddleware {
  const middleware = serverAdapter([requestHandler], adapterOptions);

  return middleware;

  function requestHandler(
    requestObject: HttpRequest,
    { requestProps }: RequestHandlerArg1
  ): RequestHandlerReturn {
    const wildcardServer = __INTERNAL_wildcardServer_middleware
      ? __INTERNAL_wildcardServer_middleware.wildcardServer
      : wildcardServer_;

    if (
      !__INTERNAL_wildcardServer_middleware &&
      Object.keys(wildcardServer.endpoints).length === 0
    ) {
      autoLoadEndpointFiles();
    }

    const context = setContext?.bind
      ? setContext.bind(null, requestObject)
      : setContext;

    return wildcardServer.getApiHttpResponse(requestProps, context, {
      __INTERNAL_universalAdapter,
    });
  }
}

function MiddlewareFactory<ServerMiddleware, HttpRequest>(
  serverAdapter: ServerAdapter<ServerMiddleware, HttpRequest>,
  __INTERNAL_universalAdapter: UniversalAdapterName,
  adapterOptions?: ServerAdapterOptions
): (setContext?: SetContext<HttpRequest>) => ServerMiddleware {
  return wildcard;
  /**
   * Set the context object - the endpoint functions' `this`.
   * @callback setContext
   * @param req The request object provided by server framework (Epxress, Koa, or Hapi).
   * @returns The context object - the endpoint functions' `this`.
   */
  /**
   * Create a Wildcard server middleware.
   * @param [setContext] Set the context object - the endpoint functions' `this`.
   * @returns Server middleware.
   */
  function wildcard(
    setContext?: SetContext<HttpRequest>,
    /** @ignore */
    { __INTERNAL_wildcardServer_middleware }: WildcardServerOption = {}
  ): ServerMiddleware {
    const middleware = createMiddleware<ServerMiddleware, HttpRequest>(
      serverAdapter,
      __INTERNAL_wildcardServer_middleware,
      adapterOptions,
      setContext,
      __INTERNAL_universalAdapter
    );
    return middleware;
  }
}
