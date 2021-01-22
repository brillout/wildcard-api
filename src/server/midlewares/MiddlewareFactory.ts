import { telefuncServer as telefuncServer_ } from "../global-instance";
import {
  ContextObject,
  HttpRequestProps,
  HttpResponseProps,
  UniversalAdapterName,
  TelefuncServer,
} from "../TelefuncServer";

export { MiddlewareFactory };

type AddContext<HttpRequest> = (
  req: HttpRequest
) => Promise<ContextObject | undefined> | ContextObject | undefined;

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
  addContext: AddContext<HttpRequest> | undefined,
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

    const context = addContext?.bind
      ? addContext.bind(null, requestObject)
      : addContext;

    return telefuncServer.getApiHttpResponse(requestProps, context, {
      __INTERNAL_universalAdapter,
    });
  }
}

function MiddlewareFactory<ServerMiddleware, HttpRequest>(
  serverAdapter: ServerAdapter<ServerMiddleware, HttpRequest>,
  __INTERNAL_universalAdapter: UniversalAdapterName,
  adapterOptions?: ServerAdapterOptions
): (addContext?: AddContext<HttpRequest>) => ServerMiddleware {
  return telefunc;
  /**
   * Create a Telefunc server middleware.
   * @param [addContext] Add context
   * @returns Server middleware.
   */
  function telefunc(
    addContext?: AddContext<HttpRequest>,
    /** @ignore */
    { __INTERNAL_telefuncServer_middleware }: TelefuncServerOption = {}
  ): ServerMiddleware {
    const middleware = createMiddleware<ServerMiddleware, HttpRequest>(
      serverAdapter,
      __INTERNAL_telefuncServer_middleware,
      adapterOptions,
      addContext,
      __INTERNAL_universalAdapter
    );
    return middleware;
  }
}
