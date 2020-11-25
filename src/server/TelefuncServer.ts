// @ts-ignore
import { stringify, parse } from "@brillout/json-s";
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import {
  assert,
  assertUsage,
  getUsageError,
  UsageError,
  setProjectInfo,
} from "@brillout/assert";
// @ts-ignore
import getUrlProps = require("@brillout/url-props");
import {
  getSetCookieHeader,
  setSecretKey,
  getContextFromCookies,
  _secretKey,
  SecretKey,
} from "./telefuncSession";

export { TelefuncServer };

loadTimeStuff();

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
  endpointDoesNotExist?: boolean & { _brand?: "endpointDoesNotExist" };
};
type MalformedIntegration = UsageError;
type WrongApiUsage = UsageError;
type ContextError = UsageError | Error;

// HTTP Request
type HttpRequestUrl = string & { _brand?: "HttpRequestUrl" };
const HttpRequestMethod = ["POST", "GET", "post", "get"];
type HttpRequestMethod = "POST" | "GET" | "post" | "get";
type HttpRequestBody = string & { _brand?: "HttpRequestBody" };
export type HttpRequestHeaders = { cookie: string } & Record<string, string>[];
//type HttpRequestHeaders = Record<string, string>[] | string[][];
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
  setSecretKey = setSecretKey.bind(this);
  [_secretKey]: SecretKey = null;

  /**
   * Get the HTTP response of API HTTP requests. Use this if you cannot use the express/koa/hapi middleware.
   * @param requestProps.url HTTP request URL
   * @param requestProps.method HTTP request method
   * @param requestProps.body HTTP request body
   * @param context The context object - the endpoint functions' `this`.
   * @returns HTTP response
   */
  async getApiHttpResponse(
    requestProps: HttpRequestProps,
    context?: Context | ContextGetter,
    /** @ignore */
    {
      __INTERNAL_universalAdapter,
    }: { __INTERNAL_universalAdapter?: UniversalAdapterName } = {}
  ): Promise<HttpResponseProps | null> {
    try {
      return await _getApiHttpResponse(
        requestProps,
        context,
        this.endpoints,
        this.config,
        this[_secretKey],
        __INTERNAL_universalAdapter
      );
    } catch (internalError) {
      // There is a bug in the Telefunc source code
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
    context = await getContext(requestProps.headers, context, secretKey);
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
  }: RequestInfo = parseRequestInfo(
    requestProps,
    endpoints,
    config,
    universalAdapterName
  );

  if (isNotTelefuncRequest) {
    return null;
  }

  if (malformedRequest) {
    return handleMalformedRequest(malformedRequest);
  }

  if (malformedIntegration) {
    return handleMalformedIntegration(malformedIntegration);
  }

  if (!endpointName || !endpointArgs) {
    assert(false);
    // Make TS happy
    throw new Error();
  }

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

  if (noEndpoints(endpoints)) {
    autoLoadEndpointFiles();
  }

  assertUsage(
    doesEndpointExist(endpointName, endpoints),
    getEndpointMissingText(endpointName, endpoints).join(" ")
  );

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

  const endpoint: EndpointFunction = endpoints[endpointName];
  assert(endpoint);
  assert(endpointIsValid(endpoint));

  const { contextProxy, contextModifications } = createContextProxy(
    context,
    endpointName,
    isDirectCall,
    universalAdapterName,
    secretKey
  );
  assert(contextProxy !== undefined);
  assert(contextProxy instanceof Object);

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

function createContextProxy(
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
      "The context object can only be modified when running the Telefunc client in the browser, but you are using the Telefunc client server-side in Node.js."
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
  endpoints: Endpoints,
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

  if (!doesEndpointExist(endpointName, endpoints)) {
    const endpointMissingText = getEndpointMissingText(endpointName, endpoints);
    return {
      malformedRequest: {
        endpointDoesNotExist: true,
        httpBodyErrorText: endpointMissingText.join("\n\n"),
      },
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
  const msg =
    "[Telefunc][Internal Error] Something unexpected happened. Please open a new issue at https://github.com/telefunc/telefunc/issues/new and include this error stack. ";
  internalError = addMessage(internalError, msg);
  console.error(internalError);
  return HttpResponse_serverSideError();
}
function addMessage(err: Error, msg: string): Error {
  if (!err) {
    err = new Error();
  }
  if (!err.message || err.message.constructor !== String) {
    err.message = "";
  }

  const prefix = "Error: ";
  if (err.message.startsWith(prefix)) {
    err.message = prefix + msg + err.message.slice(prefix.length);
  } else {
    err.message = msg + err.message;
  }

  return err;
}
function handleEndpointError(endpointError: EndpointError): HttpResponseProps {
  console.error(endpointError);
  return HttpResponse_serverSideError();
}
function handleContextError(contextError: ContextError): HttpResponseProps {
  console.error(contextError);
  return HttpResponse_serverSideError();
}
function handleWrongApiUsage(wrongApiUsage: WrongApiUsage): HttpResponseProps {
  console.error(wrongApiUsage);
  return HttpResponse_serverSideError();
}
function handleMalformedIntegration(
  malformedIntegration: MalformedIntegration
): HttpResponseProps {
  console.error(malformedIntegration);
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
  const statusCode = malformedRequest.endpointDoesNotExist ? 404 : 400;
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

  if (body === undefined) {
    assert(false);
    // Make TS happy
    throw new Error();
  }
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

function doesEndpointExist(endpointName: EndpointName, endpoints: Endpoints) {
  const endpoint: EndpointFunction | undefined = endpoints[endpointName];
  return !!endpoint;
}
function noEndpoints(endpoints: Endpoints) {
  const endpointNames = getEndpointNames(endpoints);
  return endpointNames.length === 0;
}

function getEndpointMissingText(
  endpointName: EndpointName,
  endpoints: Endpoints
): string[] {
  const endpointMissingText = [
    "Endpoint `" + endpointName + "` doesn't exist.",
  ];

  if (noEndpoints(endpoints)) {
    endpointMissingText.push("You didn't define any endpoints.");
  }

  endpointMissingText.push(
    "Make sure that the file that defines `" +
      endpointName +
      "` is named `endpoints.js` or `*.endpoints.js`: Telefunc automatically loads any file with such a name.",
    "Alternatively, you can manually load your endpoint files: `require('./path/to/file-that-defines-" +
      endpointName +
      ".js')`."
  );

  return endpointMissingText;
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

async function getContext(
  headers: HttpRequestHeaders | undefined,
  context: Context | ContextGetter,
  secretKey: SecretKey
): Promise<Context> {
  const retrievedContext = getContextFromCookies(secretKey, headers);
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

function loadTimeStuff() {
  // Some infos for `assertUsage` and `assert`
  setProjectInfo({
    projectName: "Telefunc",
    projectGithub: "https://github.com/telefunc/telefunc",
  });

  // The Telefunc server only works with Node.js
  assertNodejs();
}
