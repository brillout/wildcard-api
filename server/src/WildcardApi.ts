import { stringify, parse } from "@brillout/json-s";
import { autoLoadEndpointFiles } from "./autoLoadEndpointFiles";
import assert = require("@brillout/assert");
import getUrlProps = require("@brillout/url-props");

export { WildcardApi };

const DEBUG_CACHE =
  /*/
  true
  /*/
  false;
//*/

assert.usage(
  isNodejs(),
  "You are loading the module `@wildcard-api/server` in the browser.",
  "The module `@wildcard-api/server` is meant for your Node.js server. Load `@wildcard-api/client` instead.",
  "That is: `import {endpoints} from '@wildcard-api/client'"
);

function WildcardApi(): void {
  const options = this;

  const endpointsObject = getEndpointsObject();

  Object.assign(this, {
    endpoints: endpointsObject,
    getApiHttpResponse,
    disableEtag: false,
    // Use Proxy to validate user input
    baseUrl: "/_wildcard_api/",
    __directCall,
  });

  return this;

  async function getApiHttpResponse(requestProps, context) {
    const {
      endpointName,
      endpointArgs,
      malformationError,
      isIntrospection,
      isNotWildcardRequest,
      isHumanMode,
    } = RequestInfo({ requestProps, endpointsObject, options });

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
      return HttpIntrospectionResponse({ endpointsObject, options });
    }

    const { endpointResult, endpointError } = await runEndpoint({
      endpointName,
      endpointArgs,
      context,
      isDirectCall: false,
    });

    let responseProps;
    if (endpointError) {
      logError({ err: endpointError, endpointName });
      responseProps = HttpErrorResponse({ endpointError, isHumanMode });
    } else {
      responseProps = HttpResponse({
        endpointResult,
        isHumanMode,
        endpointName,
      });
    }
    assert.internal(responseProps.body.constructor === String);

    if (!options.disableEtag) {
      const computeEtag = require("./computeEtag");
      const etag = computeEtag(responseProps.body);
      assert.internal(etag);
      responseProps.etag = etag;
    }

    return responseProps;
  }

  async function __directCall({ endpointName, endpointArgs, context }) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor === Array);

    if (noEndpoints({ endpointsObject })) {
      autoLoadEndpointFiles();
    }

    assert.usage(
      endpointExists({ endpointName, endpointsObject }),
      getEndpointMissingError({
        endpointName,
        endpointsObject,
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
  }) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor === Array);
    assert.internal([true, false].includes(isDirectCall));

    const endpoint = endpointsObject[endpointName];
    assert.internal(endpoint);
    assert.internal(endpointIsValid(endpoint));

    const contextProxy = createContextProxy({
      context,
      endpointName,
      isDirectCall,
    });

    let endpointResult;
    let endpointError;

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

function endpointIsValid(endpoint) {
  return isCallable(endpoint) && !isArrowFunction(endpoint);
}

function validateEndpoint(obj, prop, value) {
  const endpointsObject = obj;
  const endpoint = value;
  const endpointName = prop;

  assert.usage(
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

  assert.internal(endpointIsValid);

  obj[prop] = value;

  return true;
}

function assert_plain_function(fn, errPrefix) {
  assert.usage(
    !isArrowFunction(fn),
    errPrefix + " is defined as an arrow function.",
    "You cannot use an arrow function (`() => {}`), use a plain function (`function(){}`) instead."
  );
}

function isCallable(thing) {
  return thing instanceof Function || typeof thing === "function";
}

function isArrowFunction(fn) {
  // https://stackoverflow.com/questions/28222228/javascript-es6-test-for-arrow-function-built-in-function-regular-function
  // https://gist.github.com/brillout/51da4cb90a5034e503bc2617070cfbde

  assert.internal(!yes(function () {}));
  assert.internal(yes(() => {}));
  assert.internal(!yes(async function () {}));
  assert.internal(yes(async () => {}));

  return yes(fn);

  function yes(fn) {
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
  assert.internal(method && method.toUpperCase() === method);
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

function get_html_response(htmlBody, note?) {
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

function getEndpointsObject() {
  return new Proxy({}, { set: validateEndpoint });
}

function createContextProxy({ context, endpointName, isDirectCall }) {
  const contextProxy = new Proxy(context || {}, { get, set });
  return contextProxy;

  function set(_, prop, newVal) {
    context[prop] = newVal;
    return true;
  }
  function get(_, prop) {
    assert.usage(
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

function isPropNameNormal(prop) {
  let propStr;
  try {
    propStr = prop.toString();
  } catch (err) {}

  return propStr === prop && /^[a-zA-Z0-9_]+$/.test(prop);
}

function colorizeError(text) {
  return text;
  /*
  return chalk.bold.red(text);
  */
}
function colorizeEmphasis(text) {
  return text;
  /*
  return chalk.cyan(text);
  */
}

function isPathanameBase({ pathname, options }) {
  return [options.baseUrl, options.baseUrl.slice(0, -1)].includes(pathname);
}

function RequestInfo({ requestProps, endpointsObject, options }) {
  const method = requestProps.method.toUpperCase();

  assert_request({ requestProps, method });

  const urlProps = getUrlProps(requestProps.url);
  assert.internal(urlProps.pathname.startsWith("/"));

  const { pathname } = urlProps;
  const { body: requestBody } = requestProps;
  const isHumanMode = isHumanReadableMode({ method });

  if (
    !["GET", "POST"].includes(method) ||
    (!isPathanameBase({ pathname, options }) &&
      !pathname.startsWith(options.baseUrl))
  ) {
    return { isNotWildcardRequest: true, isHumanMode };
  }
  if (isPathanameBase({ pathname, options }) && isHumanMode) {
    return { isIntrospection: true, isHumanMode };
  }

  const {
    malformationError: malformationError__pathname,
    endpointName,
    urlArgs__string,
    pathname__prettified,
  } = parsePathname({ pathname, options });

  if (malformationError__pathname) {
    return {
      malformationError: malformationError__pathname,
      endpointName,
      isHumanMode,
    };
  }

  if (!endpointExists({ endpointName, endpointsObject })) {
    return {
      malformationError: {
        endpointDoesNotExist: true,
        errorText: getEndpointMissingError({
          endpointName,
          endpointsObject,
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

  assert.internal(endpointArgs.constructor === Array);
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

  let endpointArgs__string;
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

  let endpointArgs;
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
function parsePathname({ pathname, options }) {
  assert.internal(pathname.startsWith(options.baseUrl));
  const urlParts = pathname.slice(options.baseUrl.length).split("/");

  const isMalformatted =
    urlParts.length < 1 || urlParts.length > 2 || !urlParts[0];

  const endpointName = urlParts[0];
  const urlArgs__string = urlParts[1] && decodeURIComponent(urlParts[1]);
  const pathname__prettified = isMalformatted
    ? pathname
    : options.baseUrl + endpointName + "/" + urlArgs__string;
  let malformationError;
  if (isMalformatted) {
    malformationError = {
      errorText: [
        "Malformatted API URL `" + pathname__prettified + "`",
        "API URL should have following format: `" +
          options.baseUrl +
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

function HttpIntrospectionResponse({ endpointsObject, options }) {
  if (!isDev()) {
    return get_html_response(
      "This page is available " + getDevModeNote(),
      null
    );
  }
  const htmlBody = `
Endpoints:
<ul>
${getEndpointNames({ endpointsObject })
  .map((endpointName) => {
    const endpointURL = options.baseUrl + endpointName;
    return '    <li><a href="' + endpointURL + '">' + endpointURL + "</a></li>";
  })
  .join("\n")}
</ul>
`;
  return get_html_response(htmlBody, "This page exists " + getDevModeNote());
}
function getEndpointNames({ endpointsObject }) {
  return Object.keys(endpointsObject);
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
    assert.internal(responseProps.body.constructor === String);
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
  let endpointError;
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
  assert.internal(responseProps.body.constructor === String);
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

function assert_request({ requestProps, method }) {
  const correctUsageNote = requestProps.comesFromUniversalAdapter
    ? []
    : [getApiHttpResponse__usageNote()];

  assert.usage(
    requestProps.url,
    ...correctUsageNote,
    colorizeError("`url` is missing."),
    "(`url==" + requestProps.url + "`)",
    ""
  );

  assert.usage(
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
    assert.internal("body" in requestProps);
  }
  return [
    "If you are using Express: " + expressNote,
    "If you are using Hapi: no plugin is required and the body is available at `request.payload`.",
    "If you are using Koa: " + koaNote,
  ].join("\n");
}

function logError({ err, endpointName }) {
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

function endpointExists({ endpointName, endpointsObject }) {
  const endpoint = endpointsObject[endpointName];
  return !!endpoint;
}
function noEndpoints({ endpointsObject }) {
  const endpointNames = getEndpointNames({ endpointsObject });
  return endpointNames.length === 0;
}

function getEndpointMissingError({
  endpointName,
  endpointsObject,
  calledInBrowser,
}) {
  const endpointNames = getEndpointNames({ endpointsObject });

  const errorText = [
    colorizeError("Endpoint `" + endpointName + "` doesn't exist."),
  ];

  if (noEndpoints({ endpointsObject })) {
    errorText.push(colorizeError("You didn't define any endpoints."));
  }

  assert.internal([true, false].includes(calledInBrowser));
  if (!noEndpoints({ endpointsObject }) && (!calledInBrowser || isDev())) {
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

function UsageError(msg) {
  return new Error("[@wildcard-api/server] " + msg);
}
