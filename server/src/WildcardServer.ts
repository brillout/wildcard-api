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

export { WildcardServer };

// Endpoints
type EndpointName = string & { _brand?: "EndpointName" };
type EndpointArgs = unknown[] & { _brand?: "EndpointArgs" };
type EndpointFunction = (
  ...args: EndpointArgs
) => Promise<EndpointResult> & { _brand?: "EndpointFunction" };
type Endpoints = { [key: /*EndpointName*/ string]: EndpointFunction };
//type Endpoints = Record<EndpointName, EndpointFunction>;
type EndpointResult = unknown & { _brand?: "EndpointResult" };
type EndpointError = (Error & { _brand?: "EndpointError" }) | UsageError;

// Context
type ContextObject = { [key: string]: any };
export type Context = ContextObject | undefined;
type ContextGetter = () => Promise<Context> | Context;

// Config
type Config = {
  disableEtag: boolean;
  baseUrl: string;
};
type ConfigName = keyof Config;

// Usage Error
type MalformedRequest = {
  httpBodyErrorText: string & { _brand?: "HttpBodyErrorText" };
  endpointDoesNotExist?: boolean & { _brand?: "endpointDoesNotExist" };
};
type MalformedIntegration = UsageError;
type WrongApiUsage = UsageError;

// HTTP Request
type HttpRequestUrl = string & { _brand?: "HttpRequestUrl" };
const HttpRequestMethod = ["POST", "GET", "post", "get"];
type HttpRequestMethod = "POST" | "GET" | "post" | "get";
type HttpRequestBody = string & { _brand?: "HttpRequestBody" };
export type UniversalAdapterName = "express" | "koa" | "hapi" | undefined;
export type HttpRequestProps = {
  url: HttpRequestUrl;
  method: HttpRequestMethod;
  body?: HttpRequestBody;
};
// HTTP Response
type HttpResponseBody = string & { _brand?: "HttpResponseBody" };
type HttpResponseContentType = string & { _brand?: "HttpResponseContentType" };
type HttpResponseStatusCode = number & { _brand?: "HttpResponseStatusCode" };
type HttpResponseEtag = string & { _brand?: "HttpResponseEtag" };
export type HttpResponseProps = {
  body: HttpResponseBody;
  contentType: HttpResponseContentType;
  statusCode: HttpResponseStatusCode;
  etag?: HttpResponseEtag;
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
  isNotWildcardRequest?: boolean & { _brand?: "IsNotWildcardRequest" };
};

// Some infos for `assertUsage` and `assert`
setProjectInfo({
  projectName: "Wildcard API",
  projectGithub: "https://github.com/reframejs/wildcard-api",
});

// The Wildcard server only works with Node.js
assertNodejs();

class WildcardServer {
  endpoints: Endpoints;
  config: Config;

  constructor() {
    this.endpoints = getEndpointsProxy();
    this.config = getConfigProxy({
      disableEtag: false,
      baseUrl: "/_wildcard_api/",
    });
  }

  async getApiHttpResponse(
    requestProps: HttpRequestProps,
    context: Context | ContextGetter,
    {
      __INTERNAL_universalAdapter,
    }: { __INTERNAL_universalAdapter?: UniversalAdapterName } = {}
  ): Promise<HttpResponseProps | null> {
    context = await getContext(context);

    const wrongApiUsage = validateApiUsage(
      requestProps,
      context,
      __INTERNAL_universalAdapter
    );
    if (wrongApiUsage) {
      return httpResponse_wrongApiUsage(wrongApiUsage);
    }

    const {
      endpointName,
      endpointArgs,
      malformedRequest,
      malformedIntegration,
      isNotWildcardRequest,
      isHumanMode,
    }: RequestInfo = parseRequestInfo(
      requestProps,
      this.endpoints,
      this.config,
      __INTERNAL_universalAdapter
    );

    if (isNotWildcardRequest) {
      return null;
    }

    if (malformedRequest) {
      return httpResponse_malformedRequest(malformedRequest);
    }

    if (malformedIntegration) {
      return httpResponse_malformedIntegration(malformedIntegration);
    }

    if (!endpointName || !endpointArgs) {
      assert(false);
      // Make TS happy
      throw new Error();
    }

    const { endpointResult, endpointError } = await runEndpoint(
      endpointName,
      endpointArgs,
      context,
      false,
      this.endpoints
    );

    return httpResponse_endpoint(
      endpointResult,
      endpointError,
      isHumanMode,
      endpointName,
      this.config
    );
  }

  async __directCall(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    context: Context
  ) {
    assert(endpointName);
    assert(endpointArgs.constructor === Array);

    if (noEndpoints(this.endpoints)) {
      autoLoadEndpointFiles();
    }

    assertUsage(
      doesEndpointExist(endpointName, this.endpoints),
      getEndpointMissingText(endpointName, this.endpoints).join(" ")
    );

    const resultObject = await runEndpoint(
      endpointName,
      endpointArgs,
      context,
      true,
      this.endpoints
    );

    const { endpointResult, endpointError } = resultObject;

    if (endpointError) {
      throw endpointError;
    } else {
      return endpointResult;
    }
  }
}

async function runEndpoint(
  endpointName: EndpointName,
  endpointArgs: EndpointArgs,
  context: Context,
  isDirectCall: IsDirectCall,
  endpoints: Endpoints
): Promise<{
  endpointResult?: EndpointResult;
  endpointError?: EndpointError;
}> {
  assert(endpointName);
  assert(endpointArgs.constructor === Array);
  assert([true, false].includes(isDirectCall));

  const endpoint: EndpointFunction = endpoints[endpointName];
  assert(endpoint);
  assert(endpointIsValid(endpoint));

  const contextProxy: ContextObject = createContextProxy(
    context,
    endpointName,
    isDirectCall
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

  return { endpointResult, endpointError };
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

function isArrowFunction(fn: () => any) {
  // https://stackoverflow.com/questions/28222228/javascript-es6-test-for-arrow-function-built-in-function-regular-function
  // https://gist.github.com/brillout/51da4cb90a5034e503bc2617070cfbde

  assert(!yes(function () {}));
  assert(yes(() => {}));
  assert(!yes(async function () {}));
  assert(yes(async () => {}));

  return yes(fn);

  function yes(fn: () => any) {
    if (fn.hasOwnProperty("prototype")) {
      return false;
    }
    const fnStr = fn.toString();
    if (fnStr.startsWith("async")) {
      return !fnStr.startsWith("async function");
    }
    return true;
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
  const configProxy: Config = new Proxy(configObject, { set });
  return configProxy;

  function set(_: Config, configName: ConfigName, configValue: unknown) {
    assertUsage(
      configName in configDefaults,
      [
        `Unknown config \`${configName}\`.`,
        "Make sure that the config is a `@wildcard-api/server` config",
        "and not a `@wildcard-api/client` one.",
      ].join(" ")
    );

    configObject[configName] = configValue as never;
    return true;
  }
}

function createContextProxy(
  context: Context,
  endpointName: EndpointName,
  isDirectCall: IsDirectCall
): ContextObject {
  let contextObject: ContextObject = context || {};
  const contextProxy: ContextObject = new Proxy(contextObject, { get, set });
  return contextProxy;

  function set(_: Context, contextProp: string, contextValue: unknown) {
    contextObject[contextProp] = contextValue;
    return true;
  }
  function get(_: Context, contextProp: string) {
    assertUsage(
      contextObject || !isDirectCall,
      getNodejsContextUsageNote(endpointName, contextProp)
    );

    if (!contextObject) return undefined;

    return contextObject[contextProp];
  }
}

function getNodejsContextUsageNote(endpointName: EndpointName, prop: string) {
  const propNameIsNormal = isPropNameNormal(prop);
  const contextUsageNote = ["Wrong usage of the Wildcard client in Node.js."];

  if (propNameIsNormal) {
    contextUsageNote.push(
      `Cannot get \`this.${prop}\` because you didn't provide \`${prop}\`.`,
      `Make sure to provide \`${prop}\` by using \`bind({${prop}})\` when calling your \`${endpointName}\` endpoint in Node.js.`
    );
  } else {
    contextUsageNote.push(
      "When using the Wildcard client in Node.js, make sure to use `bind()` in order to provide the context."
    );
  }

  contextUsageNote.push(
    "More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md"
  );

  return contextUsageNote.join(" ");
}

function isPropNameNormal(prop: string) {
  let propStr: string | undefined;
  try {
    propStr = prop.toString();
  } catch (err) {}

  return propStr === prop && /^[a-zA-Z0-9_]+$/.test(prop);
}

function parseRequestInfo(
  requestProps: HttpRequestProps,
  endpoints: Endpoints,
  config: Config,
  __INTERNAL_universalAdapter: UniversalAdapterName
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
    return { isNotWildcardRequest: true, isHumanMode };
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
    __INTERNAL_universalAdapter
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
  __INTERNAL_universalAdapter: UniversalAdapterName
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
          __INTERNAL_universalAdapter
            ? `Your ${__INTERNAL_universalAdapter} server is not providing the HTTP request body.`
            : "Argument `body` missing when calling `getApiHttpResponse()`.",
          "You need to provide the HTTP request body when calling an endpoint with arguments serialized to >=2000 characters.",
          getBodyUsageNote(requestProps, __INTERNAL_universalAdapter),
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

function httpResponse_endpoint(
  endpointResult: EndpointResult | undefined,
  endpointError: EndpointError | undefined,
  isHumanMode: IsHumanMode,
  endpointName: EndpointName,
  config: Config
) {
  let responseProps: HttpResponseProps;
  if (endpointError) {
    responseProps = httpResponse_endpointError(endpointError);
  } else {
    responseProps = httpResponse_endpointResult(
      endpointResult as EndpointResult,
      isHumanMode,
      endpointName
    );
  }
  assert(responseProps.body.constructor === String);

  if (!config.disableEtag) {
    const computeEtag = require("./computeEtag");
    const etag = computeEtag(responseProps.body);
    assert(etag);
    responseProps.etag = etag;
  }

  return responseProps;
}

function getEndpointNames(endpoints: Endpoints): EndpointName[] {
  return Object.keys(endpoints);
}

function httpResponse_endpointError(
  endpointError: EndpointError
): HttpResponseProps {
  console.error(endpointError);
  return HttpResponse_serverSideError();
}
function httpResponse_wrongApiUsage(
  wrongApiUsage: WrongApiUsage
): HttpResponseProps {
  console.error(wrongApiUsage);
  return HttpResponse_serverSideError();
}
function httpResponse_malformedIntegration(
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
function httpResponse_malformedRequest(
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

function httpResponse_endpointResult(
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
    return httpResponse_endpointError(endpointError);
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
  context: Context,
  __INTERNAL_universalAdapter: UniversalAdapterName
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
        !__INTERNAL_universalAdapter
    );

    const missArg = (args: string[]) =>
      `Missing argument${args.length === 1 ? "" : "s"} ${args
        .map((s) => "`" + s + "`")
        .join(" and ")} while calling \`getApiHttpResponse()\`.`;

    const missingArguments = [];
    if (!requestProps?.url) missingArguments.push("url");
    if (!requestProps?.method) missingArguments.push("method");
    assertUsage(missingArguments.length === 0, missArg(missingArguments));

    {
      const { method } = requestProps;
      assertUsage(
        HttpRequestMethod.includes(method),
        `Http request method must be one of [${HttpRequestMethod.map(
          (m) => `"${m}"`
        ).join(", ")}] but is \`${method}\`.`
      );
    }

    assertUsage(
      context === undefined || context instanceof Object,
      "The context object should be a `instanceof Object` or `undefined`."
    );
  }
}

function getBodyUsageNote(
  requestProps: HttpRequestProps,
  __INTERNAL_universalAdapter: UniversalAdapterName
) {
  const expressNote =
    "make sure to parse the body, for Express v4.16 and above: `app.use(express.json())`.";
  const koaNote =
    "make sure to parse the body, for example: `app.use(require('koa-bodyparser')())`.";
  if (__INTERNAL_universalAdapter === "express") {
    return "You seem to be using Express; " + expressNote;
  }
  if (__INTERNAL_universalAdapter === "koa") {
    return "You seem to be using Koa; " + expressNote;
  }
  if (__INTERNAL_universalAdapter === "hapi") {
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
      "` is named `endpoints.js` or `*.endpoints.js`: Wildcard automatically loads any file with such a name.",
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
      "You are loading the module `@wildcard-api/server` in the browser.",
      "The module `@wildcard-api/server` is meant for your Node.js server. Load `@wildcard-api/client` instead.",
    ].join(" ")
  );
}

async function getContext(context: Context | ContextGetter): Promise<Context> {
  if (!context) {
    return context;
  }
  if (!isCallable(context)) {
    return context as Context;
  }
  return await (context as ContextGetter)();
}
