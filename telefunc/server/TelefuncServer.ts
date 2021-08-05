import { stringify } from "@brillout/json-s";

// import { findAndLoadTelefuncFiles } from "./autoload/findAndLoadTelefuncFiles";

import {
  assert,
  assertUsage,
  getUsageError,
  internalErroPrefix,
  UsageError,
} from "./utils/assert";
import { isCallable } from "./utils/isCallable";
import { setContext } from "./getContext";

export { TelefuncServer };

// The Telefunc server only works with Node.js
assertNodejs();

// findAndLoadTelefuncFiles();

// Telefunctions
type TelefunctionName = string;
type TelefunctionArgs = unknown[];
export type Telefunction = (...args: TelefunctionArgs) => TelefunctionResult;
type Telefunctions = Record<TelefunctionName, Telefunction>;
type TelefunctionResult = unknown;
type TelefunctionError = Error | UsageError;

// Context
export type ContextObject = Record<string, any>;
export type ContextGetter = () => Promise<ContextObject> | ContextObject;

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
type IsHumanMode = boolean & { _brand?: "IsHumanMode" };

const configDefault: Config = {
  disableCache: false,
  baseUrl: "/_telefunc",
};

class TelefuncServer {
  telefunctions: Telefunctions = getTelefunctionsProxy();
  config: Config = getConfigProxy(configDefault);

  context: ContextObject = {}

  async getApiHttpResponse(
    context: Record<string, unknown> & {_telefunctionName: string, _telefunctionArgs: unknown[]},
    //context: ContextObject | undefined | ContextGetter,
    //telefuncContext: { _bodyParsed: BodyParsed }
  ): Promise<HttpResponseProps | null> {
    try {
      return await _getApiHttpResponse(
        context,
        this.telefunctions,
        this.config,
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
  userDefinedContext_: Record<string, unknown> & {_telefunctionName: string, _telefunctionArgs: unknown[]},
  telefunctions: Telefunctions,
  config: Config,
  contextProxy_: ContextObject
): Promise<HttpResponseProps | null> {

  const {
    isNotTelefuncRequest,
    isHumanMode,
  } = {isHumanMode: false, isNotTelefuncRequest: false}
  const telefunctionName = userDefinedContext_._telefunctionName
  const telefunctionArgs = userDefinedContext_._telefunctionArgs

  if (isNotTelefuncRequest) {
    return null;
  }

  /*
  if (malformedRequest) {
    return handleMalformedRequest(malformedRequest);
  }

  if (malformedIntegration) {
    return handleMalformedIntegration(malformedIntegration);
  }
  */

  assert(telefunctionName && telefunctionArgs);

  if (!telefunctionExists(telefunctionName, telefunctions)) {
    return handleTelefunctionMissing(telefunctionName, telefunctions);
  }

  const { telefunctionResult, telefunctionError} =
    await runTelefunction(
      telefunctionName,
      telefunctionArgs,
      userDefinedContext_,
      false,
      telefunctions,
      contextProxy_,
    );

  return await handleTelefunctionOutcome(
    telefunctionResult,
    telefunctionError,
    isHumanMode,
    telefunctionName,
    config,
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
): Promise<{
  telefunctionResult?: TelefunctionResult;
  telefunctionError?: TelefunctionError;
}> {
  assert(telefunctionName);
  assert(telefunctionArgs.constructor === Array);
  assert([true, false].includes(isDirectCall));

  const telefunction: Telefunction = telefunctions[telefunctionName];
  assert(telefunction);
  assert(telefunctionIsValid(telefunction));

  let telefunctionResult: TelefunctionResult | undefined;
  let telefunctionError: TelefunctionError | undefined;

  setContext(contextProxy_, isDirectCall);

  try {
    telefunctionResult = await telefunction.apply(
      contextProxy_,
      telefunctionArgs
    );
  } catch (err) {
    telefunctionError = err;
  }

  return { telefunctionResult, telefunctionError };
}

function telefunctionIsValid(telefunction: Telefunction) {
  return isCallable(telefunction);
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

  assert(telefunctionIsValid(telefunction));

  obj[prop] = value;

  return true;
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

async function handleTelefunctionOutcome(
  telefunctionResult: TelefunctionResult | undefined,
  telefunctionError: TelefunctionError | undefined,
  isHumanMode: IsHumanMode,
  telefunctionName: TelefunctionName,
  config: Config,
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
