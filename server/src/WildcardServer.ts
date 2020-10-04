// @ts-ignore
import { stringify, parse } from "@brillout/json-s";
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import { assert, assertUsage, setProjectInfo } from "@brillout/assert";
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

type RequestProps = {
  url: string;
  method: "POST" | "GET" | "post" | "get";
  body?: string;
  comesFromUniversalAdapter?: boolean;
};

type ResponseProps = {
  body: string;
  contentType: string;
  statusCode: number;
  etag?: string;
};

type IsDirectCall = boolean & { _brand?: "IsDirectCall" };

type EndpointResult = unknown & { _brand?: "EndpointResult" };
type EndpointError = Error & { _brand?: "EndpointError" };
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

type ErrorText = string & { _brand?: "ErrorText" };
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
  ) {
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
      console.error("");
      console.error(malformationError.errorText);
      console.error("");
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

    let responseProps: ResponseProps;
    if (endpointError) {
      logError(endpointError);
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
      endpointExists({ endpointName, endpointsProxy }),
      getEndpointMissingError({
        endpointName,
        endpointsProxy,
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
  const endpoint = value;
  const endpointName = prop;

  assertUsage(
    isCallable(endpoint),
    "An endpoint must be function.",
    "But `endpoints['" +
      endpointName +
      "']` is " +
      (endpoint && endpoint.constructor ? "a " : "") +
      "`" +
      (endpoint && endpoint.constructor) +
      "`"
  );

  assert_plain_function(endpoint, "The endpoint `" + endpointName + "`");

  assert(endpointIsValid(endpoint));

  obj[prop] = value;

  return true;
}

function assert_plain_function(fn: () => {}, errPrefix: string) {
  assertUsage(
    !isArrowFunction(fn),
    errPrefix + " is defined as an arrow function.",
    "You cannot use an arrow function (`() => {}`), use a plain function (`function(){}`) instead."
  );
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

function get_html_response(htmlBody: string, note?: string) {
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
      `Unkown config \`${prop}\`. Make sure that the config is a \`@wildcard-api/server\` config and not a \`@wildcard-api/client\` one.`
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
      ...getNodejsContextUsageNote({ endpointName, prop })
    );

    if (!context) return undefined;

    return context[prop];
  }
}

function getNodejsContextUsageNote({ endpointName, prop }) {
  const propNameIsNormal = isPropNameNormal(prop);
  return [
    colorizeError("Wrong usage of the Wildcard client in Node.js."),
    ...(propNameIsNormal
      ? [
          "",
          "Cannot get `this." +
            prop +
            "` because you didn't provide `" +
            prop +
            "`.",
        ]
      : []),
    "",
    colorizeEmphasis(
      propNameIsNormal
        ? "Make sure to provide `" +
            prop +
            "` by using `bind({" +
            prop +
            "})` when calling your `" +
            endpointName +
            "` endpoint in Node.js."
        : "When using the Wildcard client in Node.js, make sure to use `bind()` in order to provide `context`/`this`."
    ),
    "",
    "More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md",
  ];
}

function isPropNameNormal(prop: ContextProp) {
  let propStr: string;
  try {
    propStr = prop.toString();
  } catch (err) {}

  return propStr === prop && /^[a-zA-Z0-9_]+$/.test(prop);
}

function colorizeError(text: string) {
  return text;
  /*
  return chalk.bold.red(text);
  */
}
function colorizeEmphasis(text: string) {
  return text;
  /*
  return chalk.cyan(text);
  */
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
    pathname__prettified,
  } = parsePathname({ pathname, config });

  if (malformationError__pathname) {
    return {
      malformationError: malformationError__pathname,
      endpointName,
      isHumanMode,
    };
  }

  if (!endpointExists({ endpointName, endpointsProxy })) {
    return {
      malformationError: {
        endpointDoesNotExist: true,
        errorText: getEndpointMissingError({
          endpointName,
          endpointsProxy,
          calledInBrowser: true,
        }),
      },
      endpointName,
      isHumanMode,
    };
  }

  const { endpointArgs, malformationError } = getEndpointArgs({
    urlArgs__string,
    requestBody,
    pathname__prettified,
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
  pathname__prettified,
  requestProps,
}) {
  const ARGS_IN_BODY = "args-in-body";
  const args_are_in_body = urlArgs__string === ARGS_IN_BODY;

  let endpointArgs__string: EndpointArgsSerialized;
  if (args_are_in_body) {
    if (!requestBody) {
      return {
        malformationError: {
          errorText: [
            urlArgs__string.comesFromUniversalAdapter
              ? colorizeError(
                  "Your " +
                    urlArgs__string.comesFromUniversalAdapter +
                    " server does not provide the HTTP request body."
                )
              : [
                  getApiHttpResponse__usageNote(),
                  colorizeError("`body` is missing."),
                ].join("\n"),
            colorizeEmphasis(
              "You need to provide the HTTP request body when calling an endpoint with arguments serialized to >=2000 characters."
            ),
            getBodyUsageNote({ requestProps }),
          ].join("\n"),
        },
      };
    }
    const bodyIsValid =
      requestBody.constructor === Array ||
      (requestBody.startsWith && requestBody.startsWith("["));
    if (!bodyIsValid) {
      return {
        malformationError: {
          errorText: [
            JSON.stringify({ httpRequestBody: requestBody }),
            "Malformatted API request `" + pathname__prettified + "`.",
            colorizeError("HTTP request body should be a JSON array."),
          ].join("\n"),
        },
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
    return {
      malformationError: {
        errorText: [
          "Malformatted API request `" + pathname__prettified + "`.",
          "Cannot parse `" + endpointArgs__string + "`.",
          colorizeError("Parse Error:"),
          err_.message,
        ].join("\n"),
      },
    };
  }
  if (!endpointArgs || endpointArgs.constructor !== Array) {
    return {
      malformationError: {
        errorText: [
          JSON.stringify({ requestBody }),
          "Malformatted API request `" + pathname__prettified + "`.",
          colorizeError("The URL arguments should be an array."),
          "`" + urlArgs__string + "` is not an array",
        ].join("\n"),
      },
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
  const pathname__prettified = isMalformatted
    ? pathname
    : config.baseUrl + endpointName + "/" + urlArgs__string;
  let malformationError: MalformationError;
  if (isMalformatted) {
    malformationError = {
      errorText: [
        "Malformatted API URL `" + pathname__prettified + "`",
        "API URL should have following format: `" +
          config.baseUrl +
          'yourEndpointName/["the","endpoint","arguments"]` (or with URL encoding: `%5B%22the%22%2C%22endpoint%22%2C%22arguments%22%5D`)',
      ].join("\n"),
    };
  }

  return {
    malformationError,
    endpointName,
    urlArgs__string,
    pathname__prettified,
  };
}

function HttpIntrospectionResponse({ endpointsProxy, config }) {
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

function HttpErrorResponse({ endpointError, isHumanMode }) {
  const responseProps = {
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
function HttpResponse({ endpointResult, isHumanMode, endpointName }) {
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
    const usageError = UsageError(
      [
        `Couldn't serialize value returned by endpoint function \`${endpointName}\`.`,
        "Make sure the returned value only contains supported types: `Object`, `string`, `number`, `Date`, `null`, `undefined`, `RegExp`, `Inifinity`, `NaN`.",
        "Serialization Error: " + stringifyError.message,
      ].join(" ")
    );
    console.error(usageError);
    endpointError = usageError;
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

function HttpMalformationResponse({ malformationError }) {
  return {
    statusCode: malformationError.endpointDoesNotExist ? 404 : 400,
    contentType: "text/plain",
    body: malformationError.errorText,
  };
}

function assert_request(requestProps: RequestProps) {
  const correctUsageNote = requestProps.comesFromUniversalAdapter
    ? []
    : [getApiHttpResponse__usageNote()];

  assertUsage(
    requestProps.url,
    ...correctUsageNote,
    colorizeError("`url` is missing."),
    "(`url==" + requestProps.url + "`)",
    ""
  );

  assertUsage(
    requestProps.method,
    ...correctUsageNote,
    colorizeError("`method` is missing."),
    "(`method==" + requestProps.method + "`)",
    ""
  );
}
function getApiHttpResponse__usageNote() {
  return [
    "Usage:",
    "",
    "  `const apiResponse = await getApiHttpResponse({method, url, body}, context);`",
    "",
    "where",
    "  - `method` is the HTTP method of the request",
    "  - `url` is the HTTP URL of the request",
    "  - `body` is the HTTP body of the request",
    "  - `context` is the context passed to your endpoint functions as `this`.",
    "",
  ].join("\n");
}
function getBodyUsageNote({ requestProps }) {
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
    "If you are using Hapi: no plugin is required and the body is available at `request.payload`.",
    "If you are using Koa: " + koaNote,
  ].join("\n");
}

function logError(err: EndpointError) {
  console.error(err);
  /* TODO
  console.error("");
  console.error(err);
  console.error("");
  console.error(
    colorizeError(
      "Error thrown by endpoint function" +
        (!endpointName ? "" : " `" + endpointName + "`") +
        "."
    )
  ) + console.error("Error is printed above.");
  console.error(
    'Read the "Error Handling" documentation for how to handle errors.'
  );
  console.error("");
  */
}

function endpointExists({ endpointName, endpointsProxy }) {
  const endpoint: EndpointFunction | undefined = endpointsProxy[endpointName];
  return !!endpoint;
}
function noEndpoints({ endpointsProxy }) {
  const endpointNames = getEndpointNames({ endpointsProxy });
  return endpointNames.length === 0;
}

function getEndpointMissingError({
  endpointName,
  endpointsProxy,
  calledInBrowser,
}) {
  const endpointNames = getEndpointNames({ endpointsProxy });

  const errorText = [
    colorizeError("Endpoint `" + endpointName + "` doesn't exist."),
  ];

  if (noEndpoints({ endpointsProxy })) {
    errorText.push(colorizeError("You didn't define any endpoints."));
  }

  assert([true, false].includes(calledInBrowser));
  if (!noEndpoints({ endpointsProxy }) && (!calledInBrowser || isDev())) {
    errorText.push(
      "List of existing endpoints:",
      ...endpointNames.map((endpointName) => " - " + endpointName)
    );
  }

  errorText.push(
    colorizeEmphasis(
      "Make sure that the file that defines `" +
        endpointName +
        "` is named `endpoints.js` or `*.endpoints.js`: Wildcard automatically loads any file with such a name."
    ),
    "Alternatively, you can manually load your endpoint files: `require('./path/to/file-that-defines-" +
      endpointName +
      ".js').`"
  );

  return errorText.join("\n");
}

function getDevModeNote() {
  return "only in dev mode. (When <code>[undefined, 'development'].includes(process.env.NODE_ENV)</code> on the server.)";
}

function UsageError(msg: string) {
  return new Error("[@wildcard-api/server] " + msg);
}
