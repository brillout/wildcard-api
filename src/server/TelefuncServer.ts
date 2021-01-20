import { stringify, parse } from "@brillout/json-s";
// @ts-ignore
import getUrlProps = require("@brillout/url-props");

import {
  getSetCookieHeader,
  __setSecretKey,
  __secretKey,
  SecretKey,
} from "telefunc/context/server/cookie-management";
import {
  createContextHookFallback,
  deleteContextHookFallback,
  getContextHook,
} from "telefunc/context/server/async-hook-management";
import { resolveUserProvidedContext } from "telefunc/context/server/resolveUserProvidedContext";
import { createContextProxy } from "telefunc/context/server/createContextProxy";

import { findAndLoadTelefuncFiles } from "./autoload/findAndLoadTelefuncFiles";

import {
  assert,
  assertUsage,
  getUsageError,
  internalErroPrefix,
  UsageError,
} from "./utils/assert";
import { isCallable } from "./utils/isCallable";

export { TelefuncServer };

// The Telefunc server only works with Node.js
assertNodejs();

findAndLoadTelefuncFiles();

// Telefunctions
type TelefunctionName = string;
type TelefunctionArgs = unknown[];
type Telefunction = (...args: TelefunctionArgs) => TelefunctionResult;
type Telefunctions = Record<TelefunctionName, Telefunction>;
type TelefunctionResult = unknown;
type TelefunctionError = Error | UsageError;

// Context
export type ContextObject = Record<string, any>;
export type ContextGetter = () => Promise<ContextObject> | ContextObject;
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
export type HttpRequestUrl = string & { _brand?: "HttpRequestUrl" };
const HttpRequestMethod = ["POST", "GET", "post", "get"];
export type HttpRequestMethod = "POST" | "GET" | "post" | "get";
type HttpRequestBody = string & { _brand?: "HttpRequestBody" };
export type HttpRequestHeaders = { cookie?: string } & Record<string, string>;
export type UniversalAdapterName = "express" | "koa" | "hapi" | undefined;
export type HttpRequestProps = {
  url: HttpRequestUrl;
  method: HttpRequestMethod;
  headers: HttpRequestHeaders;
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

// Whether to call the telefunction:
// 1. over HTTP (browser-side <-> Node.js communication) or
// 2. directly (communication whithin a single Node.js process, e.g. when doing SSR).
type IsDirectCall = boolean & { _brand?: "IsDirectCall" };

// Parsing & (de-)serialization
type ArgsInUrl = string & { _brand?: "ArgsInUrl" };
type ArgsInHttpBody = string & { _brand?: "ArgsInHttpBody" };
type TelefunctionArgsSerialized = ArgsInUrl | ArgsInHttpBody;
type IsHumanMode = boolean & { _brand?: "IsHumanMode" };
type RequestInfo = {
  telefunctionName?: TelefunctionName;
  telefunctionArgs?: TelefunctionArgs;
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
  telefunctions: Telefunctions = getTelefunctionsProxy();
  config: Config = getConfigProxy(configDefault);
  setSecretKey = __setSecretKey.bind(this);
  [__secretKey]: SecretKey = null;

  context: ContextObject = createContextProxy(this);

  /**
   * Get the HTTP response of API HTTP requests. Use this if you cannot use the express/koa/hapi middleware.
   * @param requestProps.url HTTP request URL
   * @param requestProps.method HTTP request method
   * @param requestProps.body HTTP request body
   * @param requestProps.headers HTTP request headers
   * @param context The context object - the endpoint functions' `this`. TODO
   * @returns HTTP response
   */
  async getApiHttpResponse(
    requestProps: HttpRequestProps,
    context?: ContextObject | undefined | ContextGetter,
    /** @ignore */
    {
      __INTERNAL_universalAdapter,
    }: {
      __INTERNAL_universalAdapter?: UniversalAdapterName;
    } = {}
  ): Promise<HttpResponseProps | null> {
    try {
      return await _getApiHttpResponse(
        requestProps,
        context,
        this.telefunctions,
        this.config,
        this[__secretKey],
        __INTERNAL_universalAdapter,
        this.context
      );
    } catch (internalError) {
      // In case there is a bug in the Telefunc source code
      return handleInternalError(internalError);
    }
  }

  /** @private */
  async __directCall(
    telefunctionName: TelefunctionName,
    telefunctionArgs: TelefunctionArgs
  ) {
    return await directCall(
      telefunctionName,
      telefunctionArgs,
      this.telefunctions,
      this.context
    );
  }
}

async function _getApiHttpResponse(
  requestProps: HttpRequestProps,
  userDefinedContext_: ContextObject | ContextGetter | undefined,
  telefunctions: Telefunctions,
  config: Config,
  secretKey: SecretKey,
  universalAdapterName: UniversalAdapterName,
  contextProxy_: ContextObject
): Promise<HttpResponseProps | null> {
  const wrongApiUsage = validateApiUsage(requestProps, universalAdapterName);
  if (wrongApiUsage) {
    return handleWrongApiUsage(wrongApiUsage);
  }

  try {
    userDefinedContext_ = await resolveUserProvidedContext(userDefinedContext_);
  } catch (contextError) {
    return handleContextError(contextError);
  }
  assert(userDefinedContext_ instanceof Object);

  const {
    telefunctionName,
    telefunctionArgs,
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

  assert(telefunctionName && telefunctionArgs);

  if (!telefunctionExists(telefunctionName, telefunctions)) {
    return handleTelefunctionMissing(telefunctionName, telefunctions);
  }

  const {
    telefunctionResult,
    telefunctionError,
    contextModifications,
  } = await runTelefunction(
    telefunctionName,
    telefunctionArgs,
    userDefinedContext_,
    false,
    telefunctions,
    contextProxy_,
    requestProps
  );

  return await handleTelefunctionOutcome(
    telefunctionResult,
    telefunctionError,
    contextModifications,
    isHumanMode,
    telefunctionName,
    config,
    secretKey
  );
}

async function directCall(
  telefunctionName: TelefunctionName,
  telefunctionArgs: TelefunctionArgs,
  telefunctions: Telefunctions,
  contextProxy_: ContextObject
) {
  assert(telefunctionName);
  assert(telefunctionArgs.constructor === Array);

  {
    const isMissing = !telefunctionExists(telefunctionName, telefunctions);
    if (isMissing) {
      assertUsage(
        false,
        getTelefunctionMissingText(telefunctionName, telefunctions)
      );
    }
  }

  const { telefunctionResult, telefunctionError } = await runTelefunction(
    telefunctionName,
    telefunctionArgs,
    {},
    true,
    telefunctions,
    contextProxy_,
    null
  );

  if (telefunctionError) {
    throw telefunctionError;
  } else {
    return telefunctionResult;
  }
}

async function runTelefunction(
  telefunctionName: TelefunctionName,
  telefunctionArgs: TelefunctionArgs,
  userDefinedContext_: ContextObject,
  isDirectCall: IsDirectCall,
  telefunctions: Telefunctions,
  contextProxy_: ContextObject,
  requestProps: HttpRequestProps | null
): Promise<{
  telefunctionResult?: TelefunctionResult;
  telefunctionError?: TelefunctionError;
  contextModifications: ContextObject;
}> {
  assert(telefunctionName);
  assert(telefunctionArgs.constructor === Array);
  assert([true, false].includes(isDirectCall));

  const telefunction: Telefunction = telefunctions[telefunctionName];
  assert(telefunction);
  assert(telefunctionIsValid(telefunction));

  let telefunctionResult: TelefunctionResult | undefined;
  let telefunctionError: TelefunctionError | undefined;

  createContextHookFallback(requestProps);
  const contextHook = getContextHook();
  assert(contextHook);
  contextHook.userDefinedContext = {
    ...contextHook.userDefinedContext,
    ...userDefinedContext_,
  };

  try {
    telefunctionResult = await telefunction.apply(
      contextProxy_,
      telefunctionArgs
    );
  } catch (err) {
    telefunctionError = err;
  }

  const contextModifications = contextHook.contextModifications_;
  contextHook.contextModifications_ = {};
  deleteContextHookFallback(contextHook);

  return { telefunctionResult, telefunctionError, contextModifications };
}

function telefunctionIsValid(telefunction: Telefunction) {
  return isCallable(telefunction) && !isArrowFunction(telefunction);
}

function telefunctionExists(
  telefunctionName: TelefunctionName,
  telefunctions: Telefunctions
): boolean {
  return telefunctionName in telefunctions;
}

function validateTelefunction(
  obj: Telefunctions,
  prop: TelefunctionName,
  value: Telefunction
) {
  const telefunctionName = prop;
  const telefunction = value;

  assertUsage(
    isCallable(telefunction),
    [
      "A telefunction must be a function,",
      `but the telefunction \`${telefunctionName}\` is`,
      telefunction && telefunction.constructor
        ? `a \`${telefunction.constructor.name}\``
        : "`" + telefunction + "`",
    ].join(" ")
  );

  assertUsage(
    !isArrowFunction(telefunction),
    [
      "The telefunction `" + telefunctionName + "` is an arrow function.",
      "Telefunctions cannot be defined with arrow functions (`() => {}`),",
      "use a plain function (`function(){}`) instead.",
    ].join(" ")
  );

  assert(telefunctionIsValid(telefunction));

  obj[prop] = value;

  return true;
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
  telefunctionResult: TelefunctionResult
) {
  const text =
    responseProps.contentType === "application/json"
      ? JSON.stringify(
          telefunctionResult && telefunctionResult instanceof Object
            ? telefunctionResult
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

function getTelefunctionsProxy(): Telefunctions {
  const telefunction: Telefunctions = {};
  return new Proxy(telefunction, { set: validateTelefunction });
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
    telefunctionName,
    argsInUrl,
  } = parsePathname(pathname, config);

  if (malformationError__pathname) {
    return {
      malformedRequest: malformationError__pathname,
      telefunctionName,
      isHumanMode,
    };
  }

  const {
    telefunctionArgs,
    malformedRequest,
    malformedIntegration,
  } = getTelefunctionArgs(
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
      telefunctionName,
      isHumanMode,
    };
  }

  assert(telefunctionArgs && telefunctionArgs.constructor === Array);
  return {
    telefunctionArgs,
    telefunctionName,
    isHumanMode,
  };
}

function getTelefunctionArgs(
  argsInUrl: ArgsInUrl,
  requestBody: HttpRequestBody | undefined,
  requestProps: HttpRequestProps,
  universalAdapterName: UniversalAdapterName
): {
  telefunctionArgs?: TelefunctionArgs;
  malformedRequest?: MalformedRequest;
  malformedIntegration?: MalformedIntegration;
} {
  const ARGS_IN_BODY = "args-in-body";
  const args_are_in_body = argsInUrl === ARGS_IN_BODY;

  let telefunctionArgs__string: TelefunctionArgsSerialized;
  if (args_are_in_body) {
    if (!requestBody) {
      const malformedIntegration = getUsageError(
        [
          universalAdapterName
            ? `Your ${universalAdapterName} server is not providing the HTTP request body.`
            : "Argument `body` missing when calling `getApiHttpResponse()`.",
          "You need to provide the HTTP request body when calling a telefunction with arguments serialized to >=2000 characters.",
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
    telefunctionArgs__string = argsInHttpBody;
  } else {
    if (!argsInUrl) {
      return {
        telefunctionArgs: [],
      };
    }
    telefunctionArgs__string = argsInUrl;
  }

  assert(telefunctionArgs__string);

  let telefunctionArgs: TelefunctionArgs;
  try {
    telefunctionArgs = parse(telefunctionArgs__string);
  } catch (err_) {
    const httpBodyErrorText = [
      "Malformatted API request.",
      "Cannot parse `" + telefunctionArgs__string + "`.",
    ].join(" ");
    return {
      malformedRequest: { httpBodyErrorText },
    };
  }
  if (!telefunctionArgs || telefunctionArgs.constructor !== Array) {
    const httpBodyErrorText =
      "Malformatted API request. The parsed serialized telefunction arguments should be an array.";
    return {
      malformedRequest: { httpBodyErrorText },
    };
  }
  return { telefunctionArgs };
}
function parsePathname(pathname: string, config: Config) {
  assert(pathname.startsWith(config.baseUrl));
  const urlParts = pathname.slice(config.baseUrl.length).split("/");

  const isMalformatted =
    urlParts.length < 1 || urlParts.length > 2 || !urlParts[0];

  const telefunctionName = urlParts[0];
  const argsInUrl: ArgsInUrl = urlParts[1] && decodeURIComponent(urlParts[1]);
  /*
    const pathname__prettified = isMalformatted
      ? pathname
      : config.baseUrl + telefunctionName + "/" + argsInUrl;
    */
  let malformedRequest: MalformedRequest | undefined;
  if (isMalformatted) {
    malformedRequest = {
      httpBodyErrorText: "Malformatted API URL",
    };
  }

  return {
    malformedRequest,
    telefunctionName,
    argsInUrl,
  };
}

async function handleTelefunctionOutcome(
  telefunctionResult: TelefunctionResult | undefined,
  telefunctionError: TelefunctionError | undefined,
  contextModifications: ContextObject,
  isHumanMode: IsHumanMode,
  telefunctionName: TelefunctionName,
  config: Config,
  secretKey: SecretKey
): Promise<HttpResponseProps> {
  let responseProps: HttpResponseProps;
  if (telefunctionError) {
    responseProps = handleTelefunctionError(telefunctionError);
  } else {
    responseProps = handleTelefunctionResult(
      telefunctionResult as TelefunctionResult,
      isHumanMode,
      telefunctionName
    );
  }
  assert(responseProps.body.constructor === String);

  if (!config.disableCache) {
    const { computeEtag } = await import("./cache/computeEtag");
    const etag = computeEtag(responseProps.body);
    assert(etag);
    responseProps.headers = responseProps.headers || {};
    responseProps.headers.ETag = [etag];
  }

  {
    assert(Object.keys(contextModifications).length === 0 || secretKey);
    const setCookieHeader = getSetCookieHeader(secretKey, contextModifications);
    if (setCookieHeader !== null) {
      responseProps.headers = responseProps.headers || {};
      responseProps.headers["Set-Cookie"] = setCookieHeader;
    }
  }

  return responseProps;
}

function getTelefunctionNames(
  telefunctions: Telefunctions
): TelefunctionName[] {
  return Object.keys(telefunctions);
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
function handleTelefunctionError(
  telefunctionError: TelefunctionError
): HttpResponseProps {
  handleError(telefunctionError);
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
function handleTelefunctionMissing(
  telefunctionName: TelefunctionName,
  telefunctions: Telefunctions
): HttpResponseProps {
  // Avoid flooding of server-side error logs
  if (!isProduction() || noTelefunctionsDefined(telefunctions)) {
    const errorText = getTelefunctionMissingText(
      telefunctionName,
      telefunctions
    );
    const errorMissingTelefunction = getUsageError(errorText);
    handleError(errorMissingTelefunction);
  }
  return {
    statusCode: 404,
    body: `Telefunction \`${telefunctionName}\` does not exist. Check the server-side error for more information.`,
    contentType: "text/plain",
  };
}
function getTelefunctionMissingText(
  telefunctionName: TelefunctionName,
  telefunctions: Telefunctions
): string {
  assert(!telefunctionExists(telefunctionName, telefunctions));

  const noTelefunctions = noTelefunctionsDefined(telefunctions);

  const telefunctionMissingText = [
    "Telefunction `" + telefunctionName + "` does not exist.",
  ];

  if (noTelefunctions) {
    telefunctionMissingText.push("You didn't define any telefunction.");
  }

  telefunctionMissingText.push(
    [
      "Make sure that the name of your file that defines",
      "`" + telefunctionName + "`",
      "ends with `.telefunc.js`/`.telefunc.ts` (and Telefunc will automatically load it), or",
      "manually load your file with `require`/`import`.",
    ].join(" ")
  );

  if (!noTelefunctions) {
    telefunctionMissingText.push(
      `Loaded telefunctions: ${getTelefunctionNames(telefunctions)
        .map((name) => `\`${name}\``)
        .join(", ")}.`
    );
  }

  if (!noTelefunctions) {
    telefunctionMissingText.push("(This error is not shown in production.)");
  }

  return telefunctionMissingText.join(" ");
}

function handleTelefunctionResult(
  telefunctionResult: TelefunctionResult,
  isHumanMode: IsHumanMode,
  telefunctionName: TelefunctionName
): HttpResponseProps {
  let body: HttpResponseBody | undefined;
  let telefunctionError: TelefunctionError | undefined;
  try {
    const ret: string = stringify(telefunctionResult);
    body = ret;
  } catch (stringifyError) {
    telefunctionError = getUsageError(
      [
        `Couldn't serialize value returned by telefunction \`${telefunctionName}\`.`,
        "Make sure the returned values",
        "are only of the following types:",
        "`Object`, `string`, `number`, `Date`, `null`, `undefined`, `Inifinity`, `NaN`, `RegExp`.",
      ].join(" ")
    );
  }
  if (telefunctionError) {
    return handleTelefunctionError(telefunctionError);
  }

  assert(body !== undefined);
  assert(body.constructor === String);

  const responseProps: HttpResponseProps = {
    statusCode: 200,
    contentType: "application/json",
    body,
  };

  if (isHumanMode) {
    return makeHumanReadable(responseProps, telefunctionResult);
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
      (requestProps &&
        requestProps.url &&
        requestProps.method &&
        requestProps.headers &&
        "body" in requestProps) ||
        !universalAdapterName
    );

    const missingArguments = [];
    if (!requestProps?.url) missingArguments.push("url");
    if (!requestProps?.method) missingArguments.push("method");
    if (!requestProps?.headers) missingArguments.push("headers");
    assertUsage(
      missingArguments.length === 0,
      [
        "`getApiHttpResponse()`:",
        `missing argument${missingArguments.length === 1 ? "" : "s"}`,
        missingArguments.map((s) => "`" + s + "`").join(" and "),
      ].join(" ")
    );

    assertUsage(
      requestProps.headers instanceof Object &&
        !("length" in requestProps.headers),
      "`getApiHttpResponse()`: argument `headers` should be a `instanceof Object`."
    );

    assertUsage(
      !requestProps.headers.cookie ||
        typeof requestProps.headers.cookie === "string",
      "getApiHttpResponse()`: argument `headers.cookie` should be a string or `undefined`."
    );
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

function noTelefunctionsDefined(telefunctions: Telefunctions) {
  const telefunctionNames = getTelefunctionNames(telefunctions);
  return telefunctionNames.length === 0;
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

function handleError(unknownError: Error): void {
  // `unknownError` can be an error generated by user-code; it can
  // be everything and it may lack a strack trace.
  console.error(unknownError.stack || unknownError.toString());
}
