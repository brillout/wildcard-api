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

setProjectInfo({
  projectName: "@wildcard-api",
  projectGithub: "https://github.com/reframejs/wildcard-api",
  projectDocs: "https://github.com/reframejs/wildcard-api",
});

const DEBUG_CACHE =
  /*/
  true
  /*/
  false;
//*/

type Config = {
  disableEtag: boolean;
  baseUrl: string;
};

type HttpRequestUrl = string & { _brand?: "HttpRequestUrl" };
type HttpRequestMethod = "POST" | "GET" | "post" | "get";
type HttpRequestBody = string & { _brand?: "HttpRequestBody" };
type ComesFromUniversalAdapter =
  | "express"
  | "koa"
  | ("hapi" & {
      _brand?: "ComesFromUniversalAdapter";
    });
type RequestProps = {
  url: HttpRequestUrl;
  method: HttpRequestMethod;
  body?: HttpRequestBody;
  comesFromUniversalAdapter?: ComesFromUniversalAdapter;
};

type HttpResponseBody = string & { _brand?: "HttpResponseBody" };
type HttpResponseContentType = string & { _brand?: "HttpResponseContentType" };
type HttpResponseStatusCode = number & { _brand?: "HttpResponseStatusCode" };
type HttpResponseEtag = string & { _brand?: "HttpResponseEtag" };
type HttpResponseProps = {
  body: HttpResponseBody;
  contentType: HttpResponseContentType;
  statusCode: HttpResponseStatusCode;
  etag?: HttpResponseEtag;
};

type IsDirectCall = boolean & { _brand?: "IsDirectCall" };

type EndpointResult = unknown & { _brand?: "EndpointResult" };
type EndpointError = (Error & { _brand?: "EndpointError" }) | UsageError;
type EndpointArg = string & { _brand?: "EndpointArg" };
type EndpointArgs = EndpointArg[];
type EndpointArgsSerialized = string & { _brand?: "EndpointArgsSerialized" };

type ObjectKey = string | number;

type ContextValue = unknown & { _brand?: "ContextValue" };
type ContextProp = ObjectKey & { _brand?: "ContextProp" };
type ContextObject = Record<ContextProp, ContextValue>;
type ContextProxy = ContextObject;

type EndpointName = string & { _brand?: "EndpointName" };
type EndpointFunction = () => {} & { _brand?: "EndpointFunction" };
type EndpointsObject = Record<EndpointName, EndpointFunction>;
type EndpointsProxy = EndpointsObject;

type ErrorText = UsageError;
type EndpointDoesNotExist = boolean & { _brand?: "EndpointDoesNotExist" };
type MalformationError = {
  errorText: ErrorText;
  endpointDoesNotExist?: EndpointDoesNotExist;
};
type IsIntrospection = boolean & { _brand?: "IsIntrospection" };
type IsNotWildcardRequest = boolean & { _brand?: "IsNotWildcardRequest" };
type IsHumanMode = boolean & { _brand?: "IsHumanMode" };
type RequestInfo = {
  endpointName?: EndpointName;
  endpointArgs?: EndpointArgs;
  malformationError?: MalformationError;
  isIntrospection?: IsIntrospection;
  isNotWildcardRequest?: IsNotWildcardRequest;
  isHumanMode: IsHumanMode;
};

assertUsage(
  isNodejs(),
  "You are loading the module `@wildcard-api/server` in the browser.",
  "The module `@wildcard-api/server` is meant for your Node.js server. Load `@wildcard-api/client` instead."
);

function WildcardServer(): void {
  const endpointsProxy: EndpointsProxy = getEndpointsProxy();
  const config = getConfigProxy({
    disableEtag: false,
    baseUrl: "/_wildcard_api/",
  });

  Object.assign(this, {
    endpoints: endpointsProxy,
    config: config as Config,
    getApiHttpResponse,
    __directCall,
  });

  return this;

  async function getApiHttpResponse(
    requestProps: RequestProps,
    context: ContextObject
  ): Promise<HttpResponseProps> {
    const {
      endpointName,
      endpointArgs,
      malformationError,
      isIntrospection,
      isNotWildcardRequest,
      isHumanMode,
    }: RequestInfo = getRequestInfo({ requestProps, endpointsProxy, config });

    if (isNotWildcardRequest) {
      return null;
    }
    if (malformationError) {
      console.error(malformationError.errorText);
      return HttpMalformationResponse({ malformationError });
    }
    if (isIntrospection) {
      return HttpIntrospectionResponse({ endpointsProxy, config });
    }

    const { endpointResult, endpointError } = await runEndpoint({
      endpointName,
      endpointArgs,
      context,
      isDirectCall: false,
    });

    let responseProps: HttpResponseProps;
    if (endpointError) {
      console.error(endpointError);
      responseProps = HttpErrorResponse({ endpointError, isHumanMode });
    } else {
      responseProps = HttpResponse({
        endpointResult,
        isHumanMode,
        endpointName,
      });
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

  async function __directCall({ endpointName, endpointArgs, context }) {
    assert(endpointName);
    assert(endpointArgs.constructor === Array);

    if (noEndpoints({ endpointsProxy })) {
      autoLoadEndpointFiles();
    }

    assertUsage(
      doesEndpointExist(endpointName, endpointsProxy),
      getEndpointMissingText(endpointName, endpointsProxy, {
        calledInBrowser: false,
      })
    );

    const resultObject = await runEndpoint({
      endpointName,
      endpointArgs,
      context,
      isDirectCall: true,
    });

    const { endpointResult, endpointError } = resultObject;

    if (endpointError) {
      throw endpointError;
    } else {
      return endpointResult;
    }
  }

  async function runEndpoint({
    endpointName,
    endpointArgs,
    context,
    isDirectCall,
  }: {
    endpointName: EndpointName;
    endpointArgs: EndpointArgs;
    context: ContextObject;
    isDirectCall: IsDirectCall;
  }): Promise<{
    endpointResult: EndpointResult;
    endpointError: EndpointError;
  }> {
    assert(endpointName);
    assert(endpointArgs.constructor === Array);
    assert([true, false].includes(isDirectCall));

    const endpoint: EndpointFunction = endpointsProxy[endpointName];
    assert(endpoint);
    assert(endpointIsValid(endpoint));

    const contextProxy = createContextProxy({
      context,
      endpointName,
      isDirectCall,
    });

    let endpointResult: EndpointResult;
    let endpointError: EndpointError;

    try {
      endpointResult = await endpoint.apply(contextProxy, endpointArgs);
    } catch (err) {
      endpointError = err;
    }

    return { endpointResult, endpointError };
  }
}

function isNodejs() {
  return (
    typeof "process" !== "undefined" &&
    process &&
    process.versions &&
    process.versions.node
  );
}

function endpointIsValid(endpoint: EndpointFunction) {
  return isCallable(endpoint) && !isArrowFunction(endpoint);
}

function validateEndpoint(
  obj: EndpointsObject,
  prop: EndpointName,
  value: EndpointFunction
) {
  const endpointName = prop;
  const endpointFunction = value;

  assertUsage(
    isCallable(endpointFunction),
    [
      "An endpoint must be function,",
      `but \`endpoints['${endpointName}']\` is`,
      endpointFunction && endpointFunction.constructor
        ? `a ${endpointFunction.constructor}`
        : endpointFunction,
    ].join(" ")
  );

  assertUsage(
    !isArrowFunction(endpointFunction),
    [
      "The endpoint function `" + endpointName + "` is an arrow function",
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

function isArrowFunction(fn: unknown) {
  // https://stackoverflow.com/questions/28222228/javascript-es6-test-for-arrow-function-built-in-function-regular-function
  // https://gist.github.com/brillout/51da4cb90a5034e503bc2617070cfbde

  assert(!yes(function () {}));
  assert(yes(() => {}));
  assert(!yes(async function () {}));
  assert(yes(async () => {}));

  return yes(fn);

  function yes(fn: unknown) {
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

function isHumanReadableMode({ method }) {
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

function isDev() {
  if ([undefined, "development"].includes(process.env.NODE_ENV)) {
    return true;
  }
  return false;
}

function get_human_response({ responseProps, endpointResult }) {
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

function get_human_error_response({ responseProps, endpointError }) {
  let html__error = `<h1>Error</h1>
<h3>Response Body</h3>
${responseProps.body}
<br/>
<br/>
Status code: <b>${responseProps.statusCode}</b>`;

  if (isDev()) {
    html__error += `<br/>
<br/>
<h3>Original Error</h3>
<pre>
${(endpointError && endpointError.stack) || endpointError}
</pre>
<small>
The call stack is shown ${getDevModeNote()}
</small>`;
  }

  return get_html_response(html__error);
}

function get_html_response(
  htmlBody: HttpResponseBody,
  note?: string
): HttpResponseProps {
  if (note === undefined) {
    note = [
      "This page exists " + getDevModeNote(),
      "Showing HTML because the request's method is <code>GET</code>. Make a <code>POST</code> request to get JSON.",
    ].join("\n");
  }

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

  if (note) {
    body += `
<br/>
<br/>
<small>
${note.split("\n").join("<br/>\n")}
</small>
`;
  }

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

function getEndpointsProxy(): EndpointsProxy {
  const endpointsObject: EndpointsObject = {};
  return new Proxy(endpointsObject, { set: validateEndpoint });
}

function getConfigProxy(configDefaults: Config) {
  return new Proxy({ ...configDefaults }, { set: validateNewConfig });

  function validateNewConfig(obj: Config, prop: string, value: any) {
    assertUsage(
      prop in configDefaults,
      [
        `Unkown config \`${prop}\`.`,
        "Make sure that the config is a `@wildcard-api/server` config",
        "and not a `@wildcard-api/client` one.",
      ].join(" ")
    );
    return (obj[prop] = value);
  }
}

function createContextProxy({
  context,
  endpointName,
  isDirectCall,
}: {
  context: ContextObject;
  endpointName: EndpointName;
  isDirectCall: IsDirectCall;
}) {
  const contextObject: ContextObject = context || {};
  const contextProxy: ContextProxy = new Proxy(contextObject, { get, set });
  return contextProxy;

  function set(_: ContextObject, prop: ContextProp, newVal: ContextValue) {
    context[prop] = newVal;
    return true;
  }
  function get(_: ContextObject, prop: ContextProp) {
    assertUsage(
      context || !isDirectCall,
      getNodejsContextUsageNote({ endpointName, prop })
    );

    if (!context) return undefined;

    return context[prop];
  }
}

function getNodejsContextUsageNote({ endpointName, prop }) {
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

function isPropNameNormal(prop: ContextProp) {
  let propStr: string;
  try {
    propStr = prop.toString();
  } catch (err) {}

  return propStr === prop && /^[a-zA-Z0-9_]+$/.test(prop);
}

function isPathanameBase({ pathname, config }) {
  return [config.baseUrl, config.baseUrl.slice(0, -1)].includes(pathname);
}

function getRequestInfo({ requestProps, endpointsProxy, config }): RequestInfo {
  const method = requestProps.method.toUpperCase();

  assert_request(requestProps);

  const urlProps = getUrlProps(requestProps.url);
  assert(urlProps.pathname.startsWith("/"));

  const { pathname } = urlProps;
  const { body: requestBody } = requestProps;
  const isHumanMode = isHumanReadableMode({ method });

  if (
    !["GET", "POST"].includes(method) ||
    (!isPathanameBase({ pathname, config }) &&
      !pathname.startsWith(config.baseUrl))
  ) {
    return { isNotWildcardRequest: true, isHumanMode };
  }
  if (isPathanameBase({ pathname, config }) && isHumanMode) {
    return { isIntrospection: true, isHumanMode };
  }

  const {
    malformationError: malformationError__pathname,
    endpointName,
    urlArgs__string,
  } = parsePathname({ pathname, config });

  if (malformationError__pathname) {
    return {
      malformationError: malformationError__pathname,
      endpointName,
      isHumanMode,
    };
  }

  if (!doesEndpointExist(endpointName, endpointsProxy)) {
    const endpointMissingText = getEndpointMissingText(
      endpointName,
      endpointsProxy,
      {
        calledInBrowser: true,
      }
    );
    const errorText = getUsageError(endpointMissingText);
    return {
      malformationError: {
        endpointDoesNotExist: true,
        errorText,
      },
      endpointName,
      isHumanMode,
    };
  }

  const { endpointArgs, malformationError } = getEndpointArgs({
    urlArgs__string,
    requestBody,
    requestProps,
  });
  if (malformationError) {
    return {
      malformationError,
      endpointName,
      isHumanMode,
    };
  }

  assert(endpointArgs.constructor === Array);
  return {
    endpointArgs,
    endpointName,
    isHumanMode,
  };
}

function getEndpointArgs({
  urlArgs__string,
  requestBody,
  requestProps,
}): { malformationError?: MalformationError; endpointArgs?: EndpointArgs } {
  const ARGS_IN_BODY = "args-in-body";
  const args_are_in_body = urlArgs__string === ARGS_IN_BODY;

  let endpointArgs__string: EndpointArgsSerialized;
  if (args_are_in_body) {
    if (!requestBody) {
      const errorText = getUsageError(
        [
          urlArgs__string.comesFromUniversalAdapter
            ? `Your ${urlArgs__string.comesFromUniversalAdapter} server is not providing the HTTP request body.`
            : "Argument `body` missing when calling `getApiHttpResponse()`.",
          "You need to provide the HTTP request body when calling an endpoint with arguments serialized to >=2000 characters.",
          getBodyUsageNote(requestProps),
        ].join(" ")
      );
      return {
        malformationError: { errorText },
      };
    }
    const bodyIsValid =
      requestBody.constructor === Array ||
      (requestBody.startsWith && requestBody.startsWith("["));
    if (!bodyIsValid) {
      const errorText = getUsageError(
        "Malformatted API request. HTTP request body should be a serialized array."
      );
      return {
        malformationError: { errorText },
      };
    }
    endpointArgs__string =
      requestBody.constructor === Array
        ? JSON.stringify(requestBody)
        : requestBody;
  } else {
    if (!urlArgs__string) {
      return {
        endpointArgs: [],
      };
    }
    endpointArgs__string = urlArgs__string;
  }

  let endpointArgs: EndpointArgs;
  try {
    endpointArgs = parse(endpointArgs__string);
  } catch (err_) {
    const errorText = getUsageError(
      [
        "Malformatted API request.",
        "Cannot parse `" + endpointArgs__string + "`.",
        "Parse Error:",
        err_.message,
      ].join(" ")
    );
    return {
      malformationError: { errorText },
    };
  }
  if (!endpointArgs || endpointArgs.constructor !== Array) {
    const errorText = getUsageError(
      "Malformatted API request. The endpoint arguments should be an array."
    );
    return {
      malformationError: { errorText },
    };
  }
  return { endpointArgs };
}
function parsePathname({ pathname, config }) {
  assert(pathname.startsWith(config.baseUrl));
  const urlParts = pathname.slice(config.baseUrl.length).split("/");

  const isMalformatted =
    urlParts.length < 1 || urlParts.length > 2 || !urlParts[0];

  const endpointName = urlParts[0];
  const urlArgs__string = urlParts[1] && decodeURIComponent(urlParts[1]);
  /*
  const pathname__prettified = isMalformatted
    ? pathname
    : config.baseUrl + endpointName + "/" + urlArgs__string;
  */
  let malformationError: MalformationError;
  if (isMalformatted) {
    malformationError = {
      errorText: getUsageError("Malformatted API URL"),
    };
  }

  return {
    malformationError,
    endpointName,
    urlArgs__string,
  };
}

function HttpIntrospectionResponse({
  endpointsProxy,
  config,
}): HttpResponseProps {
  if (!isDev()) {
    return get_html_response(
      "This page is available " + getDevModeNote(),
      null
    );
  }
  const htmlBody = `
Endpoints:
<ul>
${getEndpointNames({ endpointsProxy })
  .map((endpointName) => {
    const endpointURL = config.baseUrl + endpointName;
    return '    <li><a href="' + endpointURL + '">' + endpointURL + "</a></li>";
  })
  .join("\n")}
</ul>
`;
  return get_html_response(htmlBody, "This page exists " + getDevModeNote());
}
function getEndpointNames({ endpointsProxy }): EndpointName[] {
  return Object.keys(endpointsProxy);
}

function HttpErrorResponse({ endpointError, isHumanMode }): HttpResponseProps {
  const responseProps: HttpResponseProps = {
    body: "Internal Server Error",
    statusCode: 500,
    contentType: "text/plain",
  };
  if (isHumanMode) {
    const responseProps_ = get_human_error_response({
      responseProps,
      endpointError,
    });
    assert(responseProps.body.constructor === String);
    return responseProps_;
  } else {
    return responseProps;
  }
}
function HttpResponse({
  endpointResult,
  isHumanMode,
  endpointName,
}): HttpResponseProps {
  const responseProps = {
    statusCode: 200,
    contentType: "application/json",
    body: undefined,
  };
  let endpointError: EndpointError;
  // TODO be able to stringify undefined instead of null
  const valueToStringify = endpointResult === undefined ? null : endpointResult;
  try {
    responseProps.body = stringify(valueToStringify);
  } catch (stringifyError) {
    endpointError = getUsageError(
      [
        `Couldn't serialize value returned by endpoint \`${endpointName}\`.`,
        "Make sure the returned value contains only the following supported types: `Object`, `string`, `number`, `Date`, `null`, `undefined`, `RegExp`, `Inifinity`, `NaN`.",
        "Serialization Error: " + stringifyError.message,
      ].join(" ")
    );
    console.error(endpointError);
  }
  if (endpointError) {
    return HttpErrorResponse({ endpointError, isHumanMode });
  }
  assert(responseProps.body.constructor === String);
  if (isHumanMode) {
    return get_human_response({ responseProps, endpointResult });
  } else {
    return responseProps;
  }
}

function HttpMalformationResponse({ malformationError }): HttpResponseProps {
  return {
    statusCode: malformationError.endpointDoesNotExist ? 404 : 400,
    contentType: "text/plain",
    body: malformationError.errorText.stack,
  };
}

function assert_request(requestProps: RequestProps) {
  assert(
    (requestProps.url && requestProps.method) ||
      !requestProps.comesFromUniversalAdapter
  );

  assertUsage(
    requestProps.url,
    "Argument `url` is missing while calling `getApiHttpResponse()`."
  );

  assertUsage(
    requestProps.method,
    "Argument `method` is missing while calling `getApiHttpResponse()`."
  );
}

function getBodyUsageNote(requestProps: RequestProps) {
  const expressNote =
    "make sure to parse the body, for Express v4.16 and above: `app.use(express.json())`.";
  const koaNote =
    "make sure to parse the body, for example: `app.use(require('koa-bodyparser')())`.";
  if (requestProps.comesFromUniversalAdapter === "express") {
    return "You seem to be using Express; " + expressNote;
  }
  if (requestProps.comesFromUniversalAdapter === "koa") {
    return "You seem to be using Koa; " + expressNote;
  }
  if (requestProps.comesFromUniversalAdapter === "hapi") {
    assert("body" in requestProps);
  }
  return [
    "If you are using Express: " + expressNote,
    "If you are using Hapi: the HTTP request body is available at `request.payload`.",
    "If you are using Koa: " + koaNote,
  ].join(" ");
}

function doesEndpointExist(
  endpointName: EndpointName,
  endpointsProxy: EndpointsProxy
) {
  const endpoint: EndpointFunction | undefined = endpointsProxy[endpointName];
  return !!endpoint;
}
function noEndpoints({ endpointsProxy }) {
  const endpointNames = getEndpointNames({ endpointsProxy });
  return endpointNames.length === 0;
}

function getEndpointMissingText(
  endpointName: EndpointName,
  endpointsProxy: EndpointsProxy,
  { calledInBrowser }: { calledInBrowser: boolean }
): string {
  const endpointNames = getEndpointNames({ endpointsProxy });

  const endpointMissingText = [
    "Endpoint `" + endpointName + "` doesn't exist.",
  ];

  if (noEndpoints({ endpointsProxy })) {
    endpointMissingText.push("You didn't define any endpoints.");
  }

  assert([true, false].includes(calledInBrowser));
  if (!noEndpoints({ endpointsProxy }) && (!calledInBrowser || isDev())) {
    endpointMissingText.push(
      "List of existing endpoints:",
      endpointNames.join(",")
    );
  }

  endpointMissingText.push(
    "Make sure that the file that defines `" +
      endpointName +
      "` is named `endpoints.js` or `*.endpoints.js`: Wildcard automatically loads any file with such a name.",
    "Alternatively, you can manually load your endpoint files: `require('./path/to/file-that-defines-" +
      endpointName +
      ".js').`"
  );

  return endpointMissingText.join(" ");
}

function getDevModeNote() {
  return "only in dev mode. (When <code>[undefined, 'development'].includes(process.env.NODE_ENV)</code> on the server.)";
}
