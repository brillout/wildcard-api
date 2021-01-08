// @ts-ignore
import { stringify, parse } from "@brillout/json-s";
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import {
  assert,
  assertUsage,
  getUsageError,
  internalErroPrefix,
  UsageError,
} from "./assert";
// @ts-ignore
import getUrlProps = require("@brillout/url-props");
import {
  getSetCookieHeader,
  __setSecretKey,
  __getContextFromCookie,
  __secretKey,
  SecretKey,
} from "./sessions";

import { bodyParser } from "./bodyParser";
import { IncomingMessage } from "http";
import asyncHooks = require("async_hooks");

export { TelefuncServer };

// The Telefunc server only works with Node.js
assertNodejs();

// Endpoints
type EndpointName = string;
type EndpointArgs = unknown[];
type EndpointFunction = (...args: EndpointArgs) => EndpointResult;
type Endpoints = Record<EndpointName, EndpointFunction>;
type EndpointResult = unknown;
type EndpointError = Error | UsageError;

// Context
export type ContextObject = Record<string, any>;
export type Context = ContextObject | undefined;
type ContextGetter = (context: ContextObject) => Promise<Context> | Context;
export type ContextModifications = { mods: null | Record<string, unknown> };

/** Telefunc Server Configuration */
type Config = {
  /** Serve Telefunc HTTP requests at `/${baseUrl}/*`. Default: `_telefunc`. */
  baseUrl: string;
  /** Whether Telefunc generates HTTP ETag headers. */
  disableCache: boolean;
};
type ConfigName = keyof Config;

// Usage Error
type MalformedRequest = {
  httpBodyErrorText: string & { _brand?: "HttpBodyErrorText" };
};
type MalformedIntegration = UsageError;
type WrongApiUsage = UsageError;
type ContextError = UsageError | Error;

// HTTP Request
type HttpRequestUrl = string & { _brand?: "HttpRequestUrl" };
const HttpRequestMethod = ["POST", "GET", "post", "get"];
type HttpRequestMethod = "POST" | "GET" | "post" | "get";
type HttpRequestBody = string & { _brand?: "HttpRequestBody" };
export type HttpRequestHeaders = { cookie?: string } & Record<string, string>;
export type UniversalAdapterName = "express" | "koa" | "hapi" | undefined;
export type HttpRequestProps = {
  url: HttpRequestUrl;
  method: HttpRequestMethod;
  headers?: HttpRequestHeaders;
  body?: HttpRequestBody;
};
// HTTP Response
type HttpResponseBody = string & { _brand?: "HttpResponseBody" };
type HttpResponseContentType = string & { _brand?: "HttpResponseContentType" };
type HttpResponseStatusCode = number & { _brand?: "HttpResponseStatusCode" };
export type HttpResponseHeaders = {
  "Set-Cookie"?: string[];
  ETag?: string[];
};
export type HttpResponseProps = {
  body: HttpResponseBody;
  contentType: HttpResponseContentType;
  statusCode: HttpResponseStatusCode;
  headers?: HttpResponseHeaders;
};

type MinusContext<EndpointFunction, Context> = EndpointFunction extends (
  this: Context,
  ...rest: infer EndpointArguments
) => infer EndpointReturnType
  ? (...rest: EndpointArguments) => EndpointReturnType
  : never;

export type FrontendType<Endpoints, Context> = {
  [EndpointName in keyof Endpoints]: MinusContext<
    Endpoints[EndpointName],
    Context
  >;
};

// Whether to call the endpoint:
// 1. over HTTP (browser-side <-> Node.js communication) or
// 2. directly (communication whithin a single Node.js process, e.g. when doing SSR).
type IsDirectCall = boolean & { _brand?: "IsDirectCall" };

// Parsing & (de-)serialization
type ArgsInUrl = string & { _brand?: "ArgsInUrl" };
type ArgsInHttpBody = string & { _brand?: "ArgsInHttpBody" };
type EndpointArgsSerialized = ArgsInUrl | ArgsInHttpBody;
type IsHumanMode = boolean & { _brand?: "IsHumanMode" };
type RequestInfo = {
  endpointName?: EndpointName;
  endpointArgs?: EndpointArgs;
  isHumanMode: IsHumanMode;
  malformedRequest?: MalformedRequest;
  malformedIntegration?: MalformedIntegration;
  isNotTelefuncRequest?: boolean & { _brand?: "IsNotTelefuncRequest" };
};

const configDefault: Config = {
  disableCache: false,
  baseUrl: "/_telefunc/",
};

class TelefuncServer {
  endpoints: Endpoints = getEndpointsProxy();
  config: Config = getConfigProxy(configDefault);
  setSecretKey = __setSecretKey.bind(this);
  getContextFromCookie = getContextFromCookie.bind(this);
  getContext = getContext.bind(this);
  [__secretKey]: SecretKey = null;

  /**
   * Get the HTTP response of API HTTP requests. Use this if you cannot use the express/koa/hapi middleware.
   * @param requestProps.url HTTP request URL
   * @param requestProps.method HTTP request method
   * @param requestProps.body HTTP request body
   * @param requestProps.headers HTTP request headers
   * @param context The context object - the endpoint functions' `this`.
   * @returns HTTP response
   */
  async getApiHttpResponse(
    requestProps: HttpRequestProps,
    context?: Context | ContextGetter,
    /** @ignore */
    {
      __INTERNAL_universalAdapter,
      __INTERNAL_requestMock,
    }: {
      __INTERNAL_universalAdapter?: UniversalAdapterName;
      __INTERNAL_requestMock?: HttpRequestProps;
    } = {}
  ): Promise<HttpResponseProps | null> {
    try {
      return await _getApiHttpResponse(
        requestProps,
        context,
        this.endpoints,
        this.config,
        this[__secretKey],
        __INTERNAL_universalAdapter
      );
    } catch (internalError) {
      // In case there is a bug in the Telefunc source code
      return handleInternalError(internalError);
    }
  }

  /** @private */
  async __directCall(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    context: Context
  ) {
    return await directCall(
      endpointName,
      endpointArgs,
      context,
      this.endpoints
    );
  }
}

async function _getApiHttpResponse(
  requestProps: HttpRequestProps,
  context: Context | ContextGetter | undefined,
  endpoints: Endpoints,
  config: Config,
  secretKey: SecretKey,
  universalAdapterName: UniversalAdapterName
): Promise<HttpResponseProps | null> {
  const wrongApiUsage = validateApiUsage(requestProps, universalAdapterName);
  if (wrongApiUsage) {
    return handleWrongApiUsage(wrongApiUsage);
  }

  try {
    context = await getContext_todo(requestProps.headers, context, secretKey);
  } catch (contextError) {
    return handleContextError(contextError);
  }
  assert(context === undefined || context instanceof Object);

  const {
    endpointName,
    endpointArgs,
    malformedRequest,
    malformedIntegration,
    isNotTelefuncRequest,
    isHumanMode,
  }: RequestInfo = parseRequestInfo(requestProps, config, universalAdapterName);

  if (isNotTelefuncRequest) {
    return null;
  }

  if (malformedRequest) {
    return handleMalformedRequest(malformedRequest);
  }

  if (malformedIntegration) {
    return handleMalformedIntegration(malformedIntegration);
  }

  assert(endpointName && endpointArgs);

  if (!endpointExists(endpointName, endpoints)) {
    return handleEndpointMissing(endpointName, endpoints);
  }

  createContextHookFallback(requestProps);
  /*
  {
    const contextHook = getContextHook();
    assert(contextHook);
    // requestProps = await contextHook.getRequestProps();
  }
  */

  const {
    endpointResult,
    endpointError,
    contextModifications,
  } = await runEndpoint(
    endpointName,
    endpointArgs,
    context,
    false,
    endpoints,
    universalAdapterName,
    secretKey
  );

  deleteContextHookFallback();

  return handleEndpointOutcome(
    endpointResult,
    endpointError,
    contextModifications,
    isHumanMode,
    endpointName,
    config,
    secretKey
  );
}

async function directCall(
  endpointName: EndpointName,
  endpointArgs: EndpointArgs,
  context: Context,
  endpoints: Endpoints
) {
  assert(endpointName);
  assert(endpointArgs.constructor === Array);

  if (noEndpointsDefined(endpoints)) {
    autoLoadEndpointFiles();
  }

  {
    const isMissing = !endpointExists(endpointName, endpoints);
    if (isMissing) {
      assertUsage(false, getEndpointMissingText(endpointName, endpoints));
    }
  }

  const {
    endpointResult,
    endpointError,
    contextModifications,
  } = await runEndpoint(
    endpointName,
    endpointArgs,
    context,
    true,
    endpoints,
    undefined,
    null
  );
  assert(contextModifications.mods === null);

  if (endpointError) {
    throw endpointError;
  } else {
    return endpointResult;
  }
}

async function runEndpoint(
  endpointName: EndpointName,
  endpointArgs: EndpointArgs,
  context: Context,
  isDirectCall: IsDirectCall,
  endpoints: Endpoints,
  universalAdapterName: UniversalAdapterName,
  secretKey: SecretKey
): Promise<{
  endpointResult?: EndpointResult;
  endpointError?: EndpointError;
  contextModifications: ContextModifications;
}> {
  assert(endpointName);
  assert(endpointArgs.constructor === Array);
  assert([true, false].includes(isDirectCall));

  const { contextProxy, contextModifications } = createContextWritableProxy(
    context,
    endpointName,
    isDirectCall,
    universalAdapterName,
    secretKey
  );
  assert(contextProxy !== undefined);
  assert(contextProxy instanceof Object);

  {
    const contextHook = getContextHook();
    assert(contextHook || isDirectCall);
    if (contextHook) {
      contextHook.contextProxy = contextProxy;
    }
  }

  const endpoint: EndpointFunction = endpoints[endpointName];
  assert(endpoint);
  assert(endpointIsValid(endpoint));

  let endpointResult: EndpointResult | undefined;
  let endpointError: EndpointError | undefined;

  try {
    endpointResult = await endpoint.apply(contextProxy, endpointArgs);
  } catch (err) {
    endpointError = err;
  }

  return { endpointResult, endpointError, contextModifications };
}

function endpointIsValid(endpoint: EndpointFunction) {
  return isCallable(endpoint) && !isArrowFunction(endpoint);
}

function endpointExists(
  endpointName: EndpointName,
  endpoints: Endpoints
): boolean {
  return endpointName in endpoints;
}

function validateEndpoint(
  obj: Endpoints,
  prop: EndpointName,
  value: EndpointFunction
) {
  const endpointName = prop;
  const endpointFunction = value;

  assertUsage(
    isCallable(endpointFunction),
    [
      "An endpoint must be a function,",
      `but the endpoint \`${endpointName}\` is`,
      endpointFunction && endpointFunction.constructor
        ? `a \`${endpointFunction.constructor.name}\``
        : "`" + endpointFunction + "`",
    ].join(" ")
  );

  assertUsage(
    !isArrowFunction(endpointFunction),
    [
      "The endpoint function `" + endpointName + "` is an arrow function.",
      "Endpoints cannot be defined with arrow functions (`() => {}`),",
      "use a plain function (`function(){}`) instead.",
    ].join(" ")
  );

  assert(endpointIsValid(endpointFunction));

  obj[prop] = value;

  return true;
}

function isCallable(thing: unknown) {
  return thing instanceof Function || typeof thing === "function";
}

function isArrowFunction(fn: () => unknown) {
  // https://stackoverflow.com/questions/28222228/javascript-es6-test-for-arrow-function-built-in-function-regular-function
  // https://gist.github.com/brillout/51da4cb90a5034e503bc2617070cfbde

  assert(!yes(function () {}));
  assert(yes(() => {}));
  assert(!yes(async function () {}));
  assert(yes(async () => {}));

  return yes(fn);

  function yes(fn: () => unknown) {
    // This (unfortunately...) seems to be the most reliable way.
    return typeof fn === "function" && /^[^{]+?=>/.test(fn.toString());
  }
}

function isHumanReadableMode(method: HttpRequestMethod) {
  const DEBUG_CACHE =
    /*/
  true
  /*/
    false;
  //*/

  assert(method && method.toUpperCase() === method);

  if (DEBUG_CACHE) {
    return false;
  }

  if (method === "GET") {
    return true;
  } else {
    return false;
  }
}

function makeHumanReadable(
  responseProps: HttpResponseProps,
  endpointResult: EndpointResult
) {
  const text =
    responseProps.contentType === "application/json"
      ? JSON.stringify(
          endpointResult && endpointResult instanceof Object
            ? endpointResult
            : JSON.parse(responseProps.body),
          null,
          2
        )
      : responseProps.body;

  return get_html_response(
    `<h1>API Response</h1>
<pre>
${text}
</pre>
<br/>
<br/>
Status code: <b>${responseProps.statusCode}</b>
`
  );
}

function get_html_response(htmlBody: HttpResponseBody): HttpResponseProps {
  const note =
    "Showing HTML because the request's method is <code>GET</code>. Make a <code>POST</code> request to get JSON.";

  let body = `<html><body>
<style>
  code {
    display: inline-block;
    padding: 0px 2px 1px 3px;
    font-size: 0.98em;
    border: 1px solid #d8d8d8;
    border-radius: 3px;
    background: #f5f5f5;
  }
  small {
    color: #777;
  }
</style>
${htmlBody}
`;

  body += `
<br/>
<br/>
<small>
${note.split("\n").join("<br/>\n")}
</small>
`;

  body += `
</body></html>
`;

  const responseProps = {
    body,
    contentType: "text/html",
    statusCode: 200,
  };

  return responseProps;
}

function getEndpointsProxy(): Endpoints {
  const Endpoints: Endpoints = {};
  return new Proxy(Endpoints, { set: validateEndpoint });
}

function getConfigProxy(configDefaults: Config): Config {
  const configObject: Config = { ...configDefaults };

  const configProxy: Config = new Proxy(configObject, { set: validateConfig });
  return configProxy;

  function validateConfig(
    _: Config,
    configName: ConfigName,
    configValue: unknown
  ) {
    assertUsage(
      configName in configDefaults,
      [
        `Unknown config \`${configName}\`.`,
        "Make sure that the config is a `telefunc/server` config",
        "and not a `telefunc/client` one.",
      ].join(" ")
    );

    configObject[configName] = configValue as never;
    return true;
  }
}

function createContextWritableProxy(
  context: Context,
  endpointName: EndpointName,
  isDirectCall: IsDirectCall,
  universalAdapterName: UniversalAdapterName,
  secretKey: SecretKey
): { contextProxy: ContextObject; contextModifications: ContextModifications } {
  let contextObj: ContextObject = { ...(context || {}) };
  const contextProxy: ContextObject = new Proxy(contextObj, { get, set });
  let contextModifications: ContextModifications = { mods: null };
  return { contextProxy, contextModifications };

  function set(_: ContextObject, contextName: string, contextValue: unknown) {
    assertUsage(
      !isDirectCall,
      "The context object can only be modified when running the Telefunc client in the browser, but you are using the Telefunc client on the server-side in Node.js."
    );
    assertUsage(
      secretKey,
      "The context object can be modified only after `setSecretKey()` has been called. Make sure you call `setSecretKey()` before modifying the context object."
    );
    contextModifications.mods = contextModifications.mods || {};
    contextModifications.mods[contextName] = contextValue;
    contextObj[contextName] = contextValue;
    return true;
  }
  function get(_: ContextObject, contextProp: string) {
    assertUsage(
      context,
      getContextUsageNote(
        endpointName,
        contextProp,
        isDirectCall,
        universalAdapterName
      )
    );

    return contextObj[contextProp];
  }
}

function createContextReadonlyProxy(contextObj: ContextObject): ContextObject {
  const contextProxy: ContextObject = new Proxy(contextObj, { set });
  return contextProxy;

  function set(_: any, contextName: string) {
    assertUsage(
      false,
      `You are trying to change the context property \`${contextName}\` outside of a telefunction call, but context can be changed only within a telefunction.`
    );
    // Make TS happy
    return false;
  }
}

function getContextUsageNote(
  endpointName: EndpointName,
  prop: string,
  isDirectCall: IsDirectCall,
  universalAdapterName: UniversalAdapterName
) {
  const common = [
    `Your endpoint function \`${endpointName}\` is trying to get \`this.${prop}\`,`,
    "but you didn't define any context and",
    "as a result `this` is `undefined`.",
    `Make sure to provide a context`,
  ].join(" ");

  if (!isDirectCall) {
    const contextSource = universalAdapterName
      ? `with the \`setContext\` function when using the \`telefunc(setContext)\` ${universalAdapterName} middleware.`
      : "when using `getApiHttpResponse(requestProps, context)`.";

    return [common, contextSource].join(" ");
  }

  assert(isDirectCall);
  assert(universalAdapterName === undefined);

  return [
    "Wrong usage of the Telefunc client in Node.js.",
    common,
    `by using \`bind({${prop}})\` when calling your \`${endpointName}\` endpoint in Node.js.`,
    "More infos at https://github.com/telefunc/telefunc/blob/master/docs/ssr-auth.md",
  ].join(" ");
}

function parseRequestInfo(
  requestProps: HttpRequestProps,
  config: Config,
  universalAdapterName: UniversalAdapterName
): RequestInfo {
  assert(requestProps.url && requestProps.method);

  const method: HttpRequestMethod = requestProps.method.toUpperCase() as HttpRequestMethod;

  const urlProps = getUrlProps(requestProps.url);
  assert(urlProps.pathname.startsWith("/"));

  const { pathname } = urlProps;
  const { body: requestBody } = requestProps;
  const isHumanMode = isHumanReadableMode(method);

  if (
    !["GET", "POST"].includes(method) ||
    !pathname.startsWith(config.baseUrl)
  ) {
    return { isNotTelefuncRequest: true, isHumanMode };
  }

  const {
    malformedRequest: malformationError__pathname,
    endpointName,
    argsInUrl,
  } = parsePathname(pathname, config);

  if (malformationError__pathname) {
    return {
      malformedRequest: malformationError__pathname,
      endpointName,
      isHumanMode,
    };
  }

  const {
    endpointArgs,
    malformedRequest,
    malformedIntegration,
  } = getEndpointArgs(
    argsInUrl,
    requestBody,
    requestProps,
    universalAdapterName
  );
  if (malformedRequest || malformedIntegration) {
    assert(!malformedIntegration || !malformedRequest);
    return {
      malformedRequest,
      malformedIntegration,
      endpointName,
      isHumanMode,
    };
  }

  assert(endpointArgs && endpointArgs.constructor === Array);
  return {
    endpointArgs,
    endpointName,
    isHumanMode,
  };
}

function getEndpointArgs(
  argsInUrl: ArgsInUrl,
  requestBody: HttpRequestBody | undefined,
  requestProps: HttpRequestProps,
  universalAdapterName: UniversalAdapterName
): {
  endpointArgs?: EndpointArgs;
  malformedRequest?: MalformedRequest;
  malformedIntegration?: MalformedIntegration;
} {
  const ARGS_IN_BODY = "args-in-body";
  const args_are_in_body = argsInUrl === ARGS_IN_BODY;

  let endpointArgs__string: EndpointArgsSerialized;
  if (args_are_in_body) {
    if (!requestBody) {
      const malformedIntegration = getUsageError(
        [
          universalAdapterName
            ? `Your ${universalAdapterName} server is not providing the HTTP request body.`
            : "Argument `body` missing when calling `getApiHttpResponse()`.",
          "You need to provide the HTTP request body when calling an endpoint with arguments serialized to >=2000 characters.",
          getBodyUsageNote(requestProps, universalAdapterName),
        ].join(" ")
      );
      return {
        malformedIntegration,
      };
    }
    const argsInHttpBody: ArgsInHttpBody =
      requestBody.constructor === Array
        ? // Server framework already parsed HTTP Request body with JSON
          JSON.stringify(requestBody)
        : // Server framework didn't parse HTTP Request body
          requestBody;
    endpointArgs__string = argsInHttpBody;
  } else {
    if (!argsInUrl) {
      return {
        endpointArgs: [],
      };
    }
    endpointArgs__string = argsInUrl;
  }

  assert(endpointArgs__string);

  let endpointArgs: EndpointArgs;
  try {
    endpointArgs = parse(endpointArgs__string);
  } catch (err_) {
    const httpBodyErrorText = [
      "Malformatted API request.",
      "Cannot parse `" + endpointArgs__string + "`.",
    ].join(" ");
    return {
      malformedRequest: { httpBodyErrorText },
    };
  }
  if (!endpointArgs || endpointArgs.constructor !== Array) {
    const httpBodyErrorText =
      "Malformatted API request. The parsed serialized endpoint arguments should be an array.";
    return {
      malformedRequest: { httpBodyErrorText },
    };
  }
  return { endpointArgs };
}
function parsePathname(pathname: string, config: Config) {
  assert(pathname.startsWith(config.baseUrl));
  const urlParts = pathname.slice(config.baseUrl.length).split("/");

  const isMalformatted =
    urlParts.length < 1 || urlParts.length > 2 || !urlParts[0];

  const endpointName = urlParts[0];
  const argsInUrl: ArgsInUrl = urlParts[1] && decodeURIComponent(urlParts[1]);
  /*
  const pathname__prettified = isMalformatted
    ? pathname
    : config.baseUrl + endpointName + "/" + argsInUrl;
  */
  let malformedRequest: MalformedRequest | undefined;
  if (isMalformatted) {
    malformedRequest = {
      httpBodyErrorText: "Malformatted API URL",
    };
  }

  return {
    malformedRequest,
    endpointName,
    argsInUrl,
  };
}

function handleEndpointOutcome(
  endpointResult: EndpointResult | undefined,
  endpointError: EndpointError | undefined,
  contextModifications: ContextModifications,
  isHumanMode: IsHumanMode,
  endpointName: EndpointName,
  config: Config,
  secretKey: SecretKey
): HttpResponseProps {
  let responseProps: HttpResponseProps;
  if (endpointError) {
    responseProps = handleEndpointError(endpointError);
  } else {
    responseProps = handleEndpointResult(
      endpointResult as EndpointResult,
      isHumanMode,
      endpointName
    );
  }
  assert(responseProps.body.constructor === String);

  if (!config.disableCache) {
    const computeEtag = require("./computeEtag");
    const etag = computeEtag(responseProps.body);
    assert(etag);
    responseProps.headers = responseProps.headers || {};
    responseProps.headers.ETag = [etag];
  }

  if (contextModifications) {
    const setCookieHeader = getSetCookieHeader(secretKey, contextModifications);
    if (setCookieHeader !== null) {
      responseProps.headers = responseProps.headers || {};
      responseProps.headers["Set-Cookie"] = setCookieHeader;
    }
  }

  return responseProps;
}

function getEndpointNames(endpoints: Endpoints): EndpointName[] {
  return Object.keys(endpoints);
}

function handleInternalError(internalError: Error): HttpResponseProps {
  internalError = addErrorPrefix(internalError, internalErroPrefix);
  handleError(internalError);
  return HttpResponse_serverSideError();
}
function addErrorPrefix(err: Error, errorPrefix: string): Error {
  assert(!errorPrefix.endsWith(" "));
  if (!err) {
    err = new Error();
  }
  if (!err.message || err.message.constructor !== String) {
    err.message = "";
  }

  const prefix = "Error: ";
  if (err.message.startsWith(prefix)) {
    err.message = prefix + errorPrefix + " " + err.message.slice(prefix.length);
  } else {
    err.message = errorPrefix + " " + err.message;
  }

  return err;
}
function handleEndpointError(endpointError: EndpointError): HttpResponseProps {
  handleError(endpointError);
  return HttpResponse_serverSideError();
}
function handleContextError(contextError: ContextError): HttpResponseProps {
  handleError(contextError);
  return HttpResponse_serverSideError();
}
function handleWrongApiUsage(wrongApiUsage: WrongApiUsage): HttpResponseProps {
  handleError(wrongApiUsage);
  return HttpResponse_serverSideError();
}
function handleMalformedIntegration(
  malformedIntegration: MalformedIntegration
): HttpResponseProps {
  handleError(malformedIntegration);
  return HttpResponse_serverSideError();
}
function HttpResponse_serverSideError(): HttpResponseProps {
  return {
    body: "Internal Server Error",
    statusCode: 500,
    contentType: "text/plain",
  };
}
function handleMalformedRequest(
  malformedRequest: MalformedRequest
): HttpResponseProps {
  // We do NOT print any error on the server-side
  // We only print the malformation error on the browser-side
  // Because it's not a server-side bug but a browser-side bug
  const statusCode = 400;
  const { httpBodyErrorText } = malformedRequest;
  return HttpResponse_browserSideError(statusCode, httpBodyErrorText);
}
function HttpResponse_browserSideError(
  errorCode: number,
  httpBodyErrorText: string
): HttpResponseProps {
  return {
    statusCode: errorCode,
    body: httpBodyErrorText,
    contentType: "text/plain",
  };
}
function handleEndpointMissing(
  endpointName: EndpointName,
  endpoints: Endpoints
): HttpResponseProps {
  // Avoid flooding of server-side error logs
  if (!isProduction() || noEndpointsDefined(endpoints)) {
    const errorText = getEndpointMissingText(endpointName, endpoints);
    const errorMissingEndpoint = getUsageError(errorText);
    handleError(errorMissingEndpoint);
  }
  return {
    statusCode: 404,
    body: `Endpoint \`${endpointName}\` does not exist. Check the server-side error for more information.`,
    contentType: "text/plain",
  };
}
function getEndpointMissingText(
  endpointName: EndpointName,
  endpoints: Endpoints
): string {
  assert(!endpointExists(endpointName, endpoints));

  const noEndpoints = noEndpointsDefined(endpoints);

  const endpointMissingText = [
    "Endpoint `" + endpointName + "` does not exist.",
  ];

  if (noEndpoints) {
    // TODO: rename to telefunction
    endpointMissingText.push("You didn't define any endpoint.");
  }

  endpointMissingText.push(
    [
      "Make sure that your file that defines",
      "`" + endpointName + "`",
      // TODO: rename to `telefunc.js`
      "is named `endpoints.js` or ends with `.endpoints.js` and Telefunc will automatically load it.",
      "For TypeScript `endpoints.ts` and `*.endpoints.ts` works as well.",
      "Alternatively, manually load your file with `require`/`import`.",
    ].join(" ")
  );

  if (!noEndpoints) {
    endpointMissingText.push(
      `Loaded endpoints: ${getEndpointNames(endpoints)
        .map((name) => `\`${name}\``)
        .join(", ")}.`
    );
  }

  if (!noEndpoints) {
    endpointMissingText.push("(This error is not shown in production.)");
  }

  return endpointMissingText.join(" ");
}

function handleEndpointResult(
  endpointResult: EndpointResult,
  isHumanMode: IsHumanMode,
  endpointName: EndpointName
): HttpResponseProps {
  let body: HttpResponseBody | undefined;
  let endpointError: EndpointError | undefined;
  try {
    const ret: string = stringify(endpointResult);
    body = ret;
  } catch (stringifyError) {
    endpointError = getUsageError(
      [
        `Couldn't serialize value returned by endpoint \`${endpointName}\`.`,
        "Make sure the returned values",
        "are only of the following types:",
        "`Object`, `string`, `number`, `Date`, `null`, `undefined`, `Inifinity`, `NaN`, `RegExp`.",
      ].join(" ")
    );
  }
  if (endpointError) {
    return handleEndpointError(endpointError);
  }

  assert(body !== undefined);
  assert(body.constructor === String);

  const responseProps: HttpResponseProps = {
    statusCode: 200,
    contentType: "application/json",
    body,
  };

  if (isHumanMode) {
    return makeHumanReadable(responseProps, endpointResult);
  } else {
    return responseProps;
  }
}

function validateApiUsage(
  requestProps: HttpRequestProps,
  universalAdapterName: UniversalAdapterName
) {
  try {
    validate();
  } catch (wrongApiUsage) {
    return wrongApiUsage;
  }
  return;
  function validate() {
    assert(
      (requestProps && requestProps.url && requestProps.method) ||
        !universalAdapterName
    );

    const missArg = (args: string[]) =>
      `Missing argument${args.length === 1 ? "" : "s"} ${args
        .map((s) => "`" + s + "`")
        .join(" and ")} while calling \`getApiHttpResponse()\`.`;

    const missingArguments = [];
    if (!requestProps?.url) missingArguments.push("url");
    if (!requestProps?.method) missingArguments.push("method");
    assertUsage(missingArguments.length === 0, missArg(missingArguments));
  }
}

function getBodyUsageNote(
  requestProps: HttpRequestProps,
  universalAdapterName: UniversalAdapterName
) {
  const expressNote =
    "make sure to parse the body, for Express v4.16 and above: `app.use(express.json())`.";
  const koaNote =
    "make sure to parse the body, for example: `app.use(require('koa-bodyparser')())`.";
  if (universalAdapterName === "express") {
    return "You seem to be using Express; " + expressNote;
  }
  if (universalAdapterName === "koa") {
    return "You seem to be using Koa; " + expressNote;
  }
  if (universalAdapterName === "hapi") {
    assert("body" in requestProps);
  }
  return [
    "If you are using Express: " + expressNote,
    "If you are using Hapi: the HTTP request body is available at `request.payload`.",
    "If you are using Koa: " + koaNote,
  ].join(" ");
}

function noEndpointsDefined(endpoints: Endpoints) {
  const endpointNames = getEndpointNames(endpoints);
  return endpointNames.length === 0;
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function assertNodejs() {
  const isNodejs =
    typeof "process" !== "undefined" &&
    process &&
    process.versions &&
    process.versions.node;
  assertUsage(
    isNodejs,
    [
      "You are loading the module `telefunc/server` in the browser.",
      "The module `telefunc/server` is meant for your Node.js server. Load `telefunc/client` instead.",
    ].join(" ")
  );
}

function getContextFromCookie(
  this: TelefuncServer,
  cookie: string | null | undefined
): ContextObject {
  assertUsage(
    this[__secretKey],
    "`setSecretKey()` needs to be called before calling `getContextFromCookie()`."
  );
  assertUsage(
    cookie === undefined || cookie === null || typeof cookie === "string",
    "`getContextFromCookie(cookie)`: `cookie` should be a string, `null`, or `undefined`"
  );
  const secretKey = this[__secretKey];
  return __getContextFromCookie(secretKey, cookie) || {};
}

//type AsyncId = number & { _brand?: "AsyncId" };
type AsyncId = number;
type ContextHook = {
  asyncId: AsyncId;
  descendents: AsyncId[];
  getRequestProps: () => Promise<HttpRequestProps>;
  getRequestHeaders: () => HttpRequestHeaders;
  contextProxy: ContextObject | null;
  isFallbackHook: boolean;
};
interface ParsedIncomingMessage extends IncomingMessage {
  complete: true;
  url: HttpRequestUrl;
  method: HttpRequestMethod;
  headers: HttpRequestHeaders;
}
const contextHooks: Record<AsyncId, ContextHook> = {};
const contextHooksMap: Record<AsyncId, AsyncId> = {};
function createContextHookFallback(requestProps: HttpRequestProps) {
  if (getContextHook()) return;

  const asyncId = asyncHooks.executionAsyncId();
  const getRequestProps = () => Promise.resolve(requestProps);
  const getRequestHeaders = () => {
    assert(requestProps.headers); // TODO
    return requestProps.headers;
  };
  createContextHook(asyncId, true, getRequestProps, getRequestHeaders);
}
function deleteContextHookFallback() {
  const contextHook = getContextHook();
  if (contextHook && contextHook.isFallbackHook) {
    deleteContextHook(contextHook.asyncId);
  }
}
function createContextHook(
  contextHookId: AsyncId,
  isFallbackHook: boolean,
  getRequestProps: () => Promise<HttpRequestProps>,
  getRequestHeaders: () => HttpRequestHeaders
): ContextHook {
  assert(!(contextHookId in contextHooks));
  const contextHook: ContextHook = {
    asyncId: contextHookId,
    getRequestProps,
    getRequestHeaders,
    descendents: [],
    contextProxy: null,
    isFallbackHook,
  };
  contextHooks[contextHookId] = contextHook;
  addDescendent(contextHookId, contextHookId);
  return contextHook;
}
function deleteContextHook(contextHookId: AsyncId) {
  for (const id of contextHooks[contextHookId].descendents) {
    assert(contextHooksMap[id] === contextHookId);
    delete contextHooksMap[id];
  }
  delete contextHooks[contextHookId];
}
function addDescendent(contextHookId: AsyncId, asyncId: AsyncId) {
  contextHooks[contextHookId].descendents.push(asyncId);
  assert(!(asyncId in contextHooksMap));
  contextHooksMap[asyncId] = contextHookId;
}
function installAsyncHook() {
  const asyncHook = asyncHooks.createHook({
    init: (
      asyncId: AsyncId,
      type: string,
      triggerAsyncId: AsyncId,
      resource: unknown
    ) => {
      if (type === "HTTPINCOMINGMESSAGE") {
        const incomingMsg = resource as IncomingMessage;
        assert(incomingMsg);
        const getRequestProps = async (): Promise<HttpRequestProps> => {
          const req = getParsedReq(incomingMsg);
          const { url, method, headers } = req;
          const body = await bodyParser(req);
          return { url, method, headers, body };
        };
        // inspectIncomingMessage(incomingMsg);
        const getRequestHeaders = (): HttpRequestHeaders => {
          // inspectIncomingMessage(incomingMsg);
          const req = getParsedReq(incomingMsg);
          const { headers } = req;
          assert(headers);
          return headers;
        };
        createContextHook(asyncId, false, getRequestProps, getRequestHeaders);
      } else {
        const contextHookId = contextHooksMap[triggerAsyncId];
        if (contextHookId) addDescendent(contextHookId, asyncId);
      }
    },
    destroy: (asyncId: AsyncId) => {
      if (!(asyncId in contextHooks)) return;
      const contextHookId = asyncId;
      deleteContextHook(contextHookId);
    },
  });
  asyncHook.enable();
}
installAsyncHook();

function getContext<Context extends Record<string, unknown>>(
  this: TelefuncServer
): Context {
  return _getContext.bind(this)() as Context;
}

function _getContext(this: TelefuncServer): ContextObject {
  const httpRequestHook = getContextHook();
  assertUsage(
    httpRequestHook,
    "TODO- Calling `getContext()` outside the lifetime of an HTTP request. On the server-side, `getContext()` always needs to be called within the lifetime of an HTTP request: make sure to call `getContext()` *after* Node.js received the HTTP request and *before* the HTTP response has been sent."
  );

  if (httpRequestHook.contextProxy) {
    return httpRequestHook.contextProxy;
  }

  const headers = httpRequestHook.getRequestHeaders();
  if (!headers?.cookie) return {};
  const { cookie } = headers;

  const secretKey = this[__secretKey];
  if (!secretKey) return {};

  const retrievedContext = __getContextFromCookie(secretKey, cookie) || {};
  httpRequestHook.contextProxy = createContextReadonlyProxy(retrievedContext);

  return httpRequestHook.contextProxy;
}

function getContextHook(): ContextHook | null {
  const asyncId = asyncHooks.executionAsyncId();
  const contextHookId = contextHooksMap[asyncId];
  if (!contextHookId) return null;
  const httpRequest = contextHooks[contextHookId];
  assert(httpRequest);
  return httpRequest;
}

function inspectIncomingMessage(incomingMsg: IncomingMessage) {
  console.log("incomingMsg.url");
  console.log((incomingMsg as any).url);
  console.log("incomingMsg.complete");
  console.log((incomingMsg as any).complete);
  console.log("incomingMsg.type");
  console.log((incomingMsg as any).type);
  console.log("Object.keys(incomingMsg)");
  console.log(Object.keys(incomingMsg));
  const hasParser = "parser" in (incomingMsg as any).socket;
  console.log("'parser' in incomingMsg.socket");
  console.log(hasParser);
  if (hasParser) {
    console.log("incomingMsg.socket.parser.incoming.complete");
    console.log((incomingMsg as any).socket.parser.incoming.complete);
    console.log("incomingMsg.socket.parser.incoming.url");
    console.log((incomingMsg as any).socket.parser.incoming.url);
    console.log("incomingMsg.socket.parser.incoming.method");
    console.log((incomingMsg as any).socket.parser.incoming.method);
    console.log("incomingMsg.socket.parser.incoming.headers");
    console.log((incomingMsg as any).socket.parser.incoming.headers);
  }
}
function getParsedReq(incomingMsg: IncomingMessage): ParsedIncomingMessage {
  const req = (incomingMsg?.socket as any)?.parser?.incoming;
  assert(req.complete === true);
  assert(typeof req.url === "string");
  assert(typeof req.method === "string");
  assert(req.headers && Object.keys(req.headers).length >= 0);
  return req;
}

async function getContext_todo(
  headers: HttpRequestHeaders | undefined,
  context: Context | ContextGetter,
  secretKey: SecretKey
): Promise<Context> {
  const retrievedContext = __getContextFromCookie(
    secretKey,
    (headers || {}).cookie
  );
  const userProvidedContext = await getUserProvidedContext(
    context,
    retrievedContext
  );

  if (retrievedContext === null && userProvidedContext === undefined) {
    return undefined;
  }
  assert(
    retrievedContext instanceof Object || userProvidedContext instanceof Object
  );

  return {
    ...retrievedContext,
    ...userProvidedContext,
  };
}

async function getUserProvidedContext(
  context: Context | ContextGetter,
  retrievedContext: ContextObject | null
): Promise<Context> {
  if (context === undefined) {
    return undefined;
  }
  const isContextFunction = isCallable(context);
  const contextFunctionName = isContextFunction
    ? getFunctionName(context as ContextGetter)
    : null;
  if (isContextFunction) {
    context = await (context as ContextGetter)(retrievedContext || {});
  }
  assertContext(
    context as ContextObject,
    isContextFunction,
    contextFunctionName
  );
  assert(context && context instanceof Object);
  return context as Context;
}

function assertContext(
  context: Context,
  isContextFunction: boolean,
  contextFunctionName: string | null
) {
  if (isContextFunction) {
    const errorMessageBegin = [
      "Your context function",
      ...(!contextFunctionName ? [] : ["`" + contextFunctionName + "`"]),
      "should",
    ].join(" ");
    assertUsage(
      context !== undefined && context !== null,
      [
        errorMessageBegin,
        "not return `" + context + "`.",
        "If there is no context, then return the empty object `{}`.",
      ].join(" ")
    );
    assertUsage(
      context instanceof Object,
      [errorMessageBegin, "return a `instanceof Object`."].join(" ")
    );
  }
  assertUsage(
    context && context instanceof Object,
    [
      "The context cannot be `" + context + "`.",
      "The context should be a `instanceof Object`.",
      "If there is no context then use the empty object `{}`.",
    ].join(" ")
  );
}

function getFunctionName(fn: (...args: any[]) => any): string {
  let { name } = fn;
  if (!name) {
    return name;
  }
  const PREFIX = "bound ";
  if (name.startsWith(PREFIX)) {
    return name.slice(PREFIX.length);
  }
  return name;
}

function handleError(unknownError: Error): void {
  // `unknownError` can be an error generated by user-code; it can
  // be everything and it may lack a strack trace.
  console.error(unknownError.stack || unknownError.toString());
}
