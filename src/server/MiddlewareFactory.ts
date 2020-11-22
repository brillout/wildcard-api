import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import { telefuncServer as telefuncServer_ } from "./global-instance";
import {
  Context,
  HttpRequestProps,
  HttpResponseProps,
  UniversalAdapterName,
  TelefuncServer,
} from "./TelefuncServer";

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

type TelefuncServerHolder = {
  telefuncServer: TelefuncServer;
};
type TelefuncServerOption = {
  __INTERNAL_telefuncServer_middleware?: TelefuncServerHolder;
};

function createMiddleware<ServerMiddleware, HttpRequest>(
  serverAdapter: ServerAdapter<ServerMiddleware, HttpRequest>,
  __INTERNAL_telefuncServer_middleware: TelefuncServerHolder | undefined,
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
    const telefuncServer = __INTERNAL_telefuncServer_middleware
      ? __INTERNAL_telefuncServer_middleware.telefuncServer
      : telefuncServer_;

    if (
      !__INTERNAL_telefuncServer_middleware &&
      Object.keys(telefuncServer.endpoints).length === 0
    ) {
      autoLoadEndpointFiles();
    }

    const context = setContext?.bind
      ? setContext.bind(null, requestObject)
      : setContext;

    return telefuncServer.getApiHttpResponse(requestProps, context, {
      __INTERNAL_universalAdapter,
    });
  }
}

function MiddlewareFactory<ServerMiddleware, HttpRequest>(
  serverAdapter: ServerAdapter<ServerMiddleware, HttpRequest>,
  __INTERNAL_universalAdapter: UniversalAdapterName,
  adapterOptions?: ServerAdapterOptions
): (setContext?: SetContext<HttpRequest>) => ServerMiddleware {
  return telefunc;
  /**
   * Set the context object - the endpoint functions' `this`.
   * @callback setContext
   * @param req The request object provided by server framework (Epxress, Koa, or Hapi).
   * @returns The context object - the endpoint functions' `this`.
   */
  /**
   * Create a Telefunc server middleware.
   * @param [setContext] Set the context object - the endpoint functions' `this`.
   * @returns Server middleware.
   */
  function telefunc(
    setContext?: SetContext<HttpRequest>,
    /** @ignore */
    { __INTERNAL_telefuncServer_middleware }: TelefuncServerOption = {}
  ): ServerMiddleware {
    const middleware = createMiddleware<ServerMiddleware, HttpRequest>(
      serverAdapter,
      __INTERNAL_telefuncServer_middleware,
      adapterOptions,
      setContext,
      __INTERNAL_universalAdapter
    );
    return middleware;
  }
}
