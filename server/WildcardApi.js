const assert = require('@brillout/reassert');
const defaultSerializer = require('json-s');
const chalk = require('chalk');
const docsUrl = require('../package.json').repository;
const getUrlProps = require('@brillout/url-props');

const DEFAULT_API_URL_BASE = '/wildcard/';

assert.usage(
  isNodejs(),
  "You are loading the module `wildcard-api` in the browser.",
  "The module `wildcard-api` is meant for your Node.js server. Load `wildcard-api/client` instead.",
  "That is: `import {endpoints} from 'wildcard-api/client'",
);

module.exports = WildcardApi;

function WildcardApi(options={}) {
  const endpointsObject = getEndpointsObject();

  Object.assign(
    options,
    {
      endpoints: endpointsObject,
      getApiResponse,
      __directCall,
    },
  );

  return options;

  async function getApiResponse(requestProps) {
    const reqInfos = getReqInfos(requestProps);
    const {method, pathname, body} = reqInfos;

    // URL is not a Wildcard URL
    if( ! ['GET', 'POST'].includes(method) ) {
      return null;
    }
    if( !isPathanameBase({pathname}) && !pathname.startsWith(getPathnameBase()) ){
      return null;
    }

    // `pathname` is the base pathname `/wildcard`
    if( isPathanameBase({pathname}) && isDev() && isHumanReadableMode({method}) ){
      return {
        statusCode: 200,
        contentType: 'text/html',
        body: getListOfEndpoints(),
      };
    }

    const {isInvalidUrl, invalidReason, errorStatusCode, endpointName, endpointArgs} = parseRequest({method, pathname, body});

    // URL is invalid
    assert.internal([true, false].includes(isInvalidUrl));
    assert.internal(invalidReason!==undefined);
    if( isInvalidUrl ) {
      assert.internal(invalidReason);
      assert.internal(errorStatusCode);
      return {
        statusCode: errorStatusCode,
        contentType: 'text/plain',
        body: invalidReason,
      };
    }

    const resultObject = await runEndpoint({endpointName, endpointArgs, requestProps, isDirectCall: false});
    compute_response_object({resultObject, method});

    if( resultObject.endpointError ) {
      console.error('');
      console.error(resultObject.endpointError);
      console.error('');
      console.error(colorizeError('Error thrown by endpoint function `'+endpointName+'`.'))+
      console.error('Error is printed above.');
      // console.error("Your endpoint function `"+endpointName+"` should not throw errors. This error should be a bug. Read the \"Error Handling\" section of Wildcard's GitHub Readme for more infos.");
      console.error('');
    }

    const {respObject} = resultObject;
    assert.internal(respObject.body.constructor===String);
    assert.internal(respObject.statusCode);
    assert.internal(respObject.contentType);
    return respObject;
  }

  function getHumanReadableBody(resultObject) {
    const {endpointError} = resultObject;
    if( endpointError ) {
      return getHtml_error(resultObject);
    } else {
      return getHtml_body(resultObject);
    }
  }

  async function __directCall({endpointName, endpointArgs, requestProps}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);

    assert.usage(
      endpointExists(endpointName),
      getNoEndpointError({endpointName, calledInBrowser: false}),
    );

    const resultObject = await runEndpoint({endpointName, endpointArgs, requestProps, isDirectCall: true});

    const {endpointResult, endpointError} = resultObject;

    if( endpointError ) {
      throw endpointError;
    } else {
      return endpointResult;
    }
  }

  function parseRequest({method, pathname, body}) {
    const {isInvalidSyntax, pathname__prettified} = parsePathname(pathname);
    if( isInvalidSyntax ) {
      return {
        isInvalidUrl: true,
        errorStatusCode: 400,
        invalidReason: [
          'Malformatted API URL `'+pathname__prettified+'`',
          'API URL should have following format: `/wildcard/yourEndpointName/["the","endpoint","arguments"]` (or with URL encoding: `%5B%22the%22%2C%22endpoint%22%2C%22arguments%22%5D`)',
        ].join('\n'),
      };
    }

    const endpointName = getEndpointName({pathname});
    const endpointArgs = getEndpointArgs({method, pathname, body});

    assert.internal(endpointArgs.isInvalidUrl===true || endpointArgs.constructor===Array);
    if( endpointArgs.isInvalidUrl ){
      return endpointArgs;
    }

    if( ! endpointExists(endpointName) ) {
      return {
        isInvalidUrl: true,
        errorStatusCode: 404,
        invalidReason: getNoEndpointError({endpointName, calledInBrowser: true}),
      };
    }

    return {
      isInvalidUrl: false,
      invalidReason: null,
      endpointName,
      endpointArgs,
    };
  }

  function getEndpointName({pathname}){
    const {endpointName} = parsePathname(pathname);
    return endpointName;
  }

  function getEndpointArgs({method, pathname, body}){
    const {urlArgs, pathname__prettified} = parsePathname(pathname);
    assert.internal(['GET', 'POST'].includes(method));
    assert.internal(!(method==='GET' && body));
    assert.internal(!(method==='POST' && !body));
    assert.internal(!body || [Array, String].includes(body.constructor));
    let endpointArgsString = urlArgs || JSON.stringify(body);
    let endpointArgs;
    if( endpointArgsString ){
      const parse = options.parse || defaultSerializer.parse;
      try {
        endpointArgs = parse(endpointArgsString);
      } catch(err_) {
        return {
          isInvalidUrl: true,
          errorStatusCode: 400,
          invalidReason: (
            [
              'Malformatted API URL `'+pathname__prettified+'`.',
              "JSON Parse Error:",
              err_.message,
              "Argument string:",
              endpointArgsString,
              "Couldn't JSON parse the argument string.",
              "Is the argument string a valid JSON?",
            ].join('\n')
          ),
        };
      }
    }

    endpointArgs = endpointArgs || [];

    if( endpointArgs.constructor!==Array ) {
      return {
        isInvalidUrl: true,
        errorStatusCode: 400,
        invalidReason: (
          [
            'Malformatted API URL `'+pathname__prettified+'`.',
            'API URL arguments (i.e. endpoint arguments) should be an array.',
            "Instead we got `"+endpointArgs.constructor+"`.",
            'API URL arguments: `'+endpointArgsString+'`',
          ].join('\n')
        ),
      };
    }

    return endpointArgs;
  }

  function parsePathname(pathname){
    const pathnameBase = getPathnameBase();

    assert.internal(pathname.startsWith(pathnameBase));
    const urlParts = pathname.slice(pathnameBase.length).split('/');

    const isInvalidSyntax = urlParts.length<1 || urlParts.length>2 || !urlParts[0];
    const endpointName = urlParts[0];
    const urlArgs = urlParts[1] && decodeURIComponent(urlParts[1]);
    const pathname__prettified = isInvalidSyntax ? pathname : '/wildcard/'+endpointName+'/'+urlArgs;

    return {
      isInvalidSyntax,
      endpointName,
      urlArgs,
      pathname__prettified,
    };
  }

  function compute_response_object({resultObject, method}) {
    const {endpointResult, respObject} = resultObject;
    let {endpointError} = resultObject;

    let body;
    if( !endpointError ) {
      // TODO be able to stringify undefined instead of null
      const valueToStringify = endpointResult===undefined ? null : endpointResult;
      const stringify = options.stringify || defaultSerializer.stringify;
      try {
        body = stringify(valueToStringify);
      } catch(err_) {
        console.error(err_);
        console.log('\n');
        console.log('Returned value');
        console.log(valueToStringify);
        console.log('\n');
        assert.internal(err_);
        endpointError = err_;
        assert.warning(
          false,
          "Couldn't serialize value returned by endpoint function `"+endpointName+"`.",
          "The returned value in question and the serialization error are printed above.",
        );
      }
    }

    if( endpointError ) {
      respObject.body = respObject.body || 'Internal Server Error';
      respObject.statusCode = respObject.statusCode || 500;
      respObject.contentType = respObject.contentType || 'text/plain';
    } else {
      assert.internal(body.constructor===String);
      respObject.body = respObject.body || body;
      respObject.statusCode = respObject.statusCode || 200;
      respObject.contentType = respObject.contentType || 'application/json';
    }

    if( isHumanReadableMode({method}) ){
      const humanReadableBody = getHumanReadableBody(resultObject);
      respObject.body = humanReadableBody;
      respObject.contentType = 'text/html';
      respObject.statusCode = 200;
    }
  }

  function getReqInfos(requestProps) {
    const correctUsage = [
      "Usage:",
      "",
      "  `const apiResponse = await getApiResponse({method, url, body, ...req});`",
      "",
      "where",
      "  - `method` is the HTTP method of the request",
      "  - `url` is the HTTP URL of the request",
      "  - `body` is the HTTP body of the request",
      "  - `req` are optional additional request information such as HTTP headers.",
      "",
    ].join('\n');

    assert.usage(
      requestProps.url,
      correctUsage,
      colorizeError("`url` is missing."),
      "(`url=="+requestProps.url+"`)",
      '',
    );
    const {pathname} = getUrlProps(requestProps.url);
    assert.internal(pathname.startsWith('/'));

    assert.usage(
      requestProps.method,
      correctUsage,
      colorizeError("`method` is missing."),
      "(`method==="+requestProps.method+"`)",
      '',
    );
    const method = requestProps.method.toUpperCase();

    const bodyUsageInfo = [
      "If you are using Express: Make sure to parse the body. For Express v4.16 and above: `app.use(express.json())`.",
      "If you are using Hapi: No plugin is required and the body is available at `request.payload`.",
      "If you are using Koa: Make sure to parse the body, for example: `app.use(require('koa-bodyparser')())`.",
    ].join('\n');
    const {body} = requestProps;
    const bodyErrMsg = "`body` is missing but it should be the HTTP request body.";
    assert.usage(
      !(method==='POST' && !body),
      correctUsage,
      colorizeError(bodyErrMsg),
      bodyUsageInfo,
      '',
    );
    assert.usage(
      'body' in requestProps,
      correctUsage,
      colorizeError(bodyErrMsg),
      "Note that `requestProps.body` can be `null` or `undefined` but make sure to define it on the `requestProps`, e.g. `requestProps.body = null;`, i.e. make sure that `'body' in requestProps`.",
      '',
    );
    assert.usage(
      !body || [Array, String].includes(body.constructor),
      correctUsage,
      colorizeError("Unexpected `body` type: `body` should be a string or an array."),
      "(`body.constructor==="+(body && body.constructor)+"`)",
      bodyUsageInfo,
      '',
    );

    return {method, pathname, body};
  }

  async function runEndpoint({endpointName, endpointArgs, requestProps, isDirectCall}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);
    assert.internal([true, false].includes(isDirectCall));

    const endpoint = endpointsObject[endpointName];
    assert.internal(endpoint);
    assert.internal(endpointIsValid(endpoint));

    const requestProps_proxy = create_requestProps_proxy({requestProps, endpointName, isDirectCall});

    let endpointResult;
    let endpointError;

    try {
      endpointResult = await endpoint.apply(
        requestProps_proxy,
        endpointArgs,
      );
    } catch(err) {
      endpointError = err;
    }

    // TODO - remove onEndpointCall
    const resultObject = {
      req: requestProps,
      endpointName,
      endpointArgs,
      endpointError,
      endpointResult,
      overwriteResult: val => {
        resultObject.endpointResult = val;
      },
      respObject: {},
      overwriteResponse: respObject__overwritten => {
        assert.usage(
          respObject__overwritten instanceof Object,
          "Wrong argument `resp` when calling `overwriteResponse(resp)`.",
          "`resp` needs to be an object. (I.e. `resp instanceof Object`.)",
        );
        resultObject.respObject = respObject__overwritten;
      },
    };

    if( options.onEndpointCall ){
      const retVal = (
        await options.onEndpointCall.call(
          null,
          resultObject,
        )
      );
      assert.usage(
        retVal===undefined,
        "The `onEndpointCall` function should always return `undefined`.",
        "Instead it returned `"+retVal+"`.",
        "If you want to overwrite the endpoint result then use the `overwriteResult` function instead."
      );
    }

    return resultObject;
  }
  function endpointExists(endpointName) {
    const endpoint = endpointsObject[endpointName];
    return !!endpoint;
  }

  function isPathanameBase({pathname}) {
    const urlBase = getPathnameBase();
    if( pathname===urlBase ) {
      return true;
    }
    if( urlBase.endsWith('/') && pathname===urlBase.slice(0, -1) ) {
      return true;
    }
    return false;
  }
  function getEndpointNames() {
    return Object.keys(endpointsObject);
  }
  function noEndpointsDefined() {
    return getEndpointNames().length===0;
  }
  function getNoEndpointError({endpointName, calledInBrowser}) {
    assert.internal([true, false].includes(calledInBrowser));

    if( noEndpointsDefined() ) {
      const invalidReason__part1 = 'Endpoint `'+endpointName+"` doesn't exist.";
      const invalidReason__part2 = "You didn't define any endpoint function.";
      const invalidReason__part3 = "Did you load your endpoint definitions? E.g. `require('./path/to/your/endpoint-functions.js')`.";
      console.error(invalidReason__part1);
      console.error(colorizeError(invalidReason__part2));
      console.error(invalidReason__part3);
      return [
        invalidReason__part1,
        invalidReason__part2,
        invalidReason__part3,
      ].join('\n');
    } else {
      return (
        'Endpoint `'+endpointName+"` doesn't exist." + (
          (calledInBrowser && !isDev()) ? '' : (
            '\n\nEndpoints: ' +
            getEndpointNames().map(endpointName => '\n - '+endpointName).join('') +
            "\n\n(Make sure that the file that defines `"+endpointName+"` is loaded, i.e. does your code call `require('./path/to/file/defining-"+endpointName+".js'?)`.)" + (
              !calledInBrowser ? '' : '\n\n(The list of endpoints is only shown in development.)'
            )
          )
        )
      );
    }
  }
  function getListOfEndpoints() {
    const htmlBody = `
Endpoints:
<ul>
${
  getEndpointNames()
  .map(endpointName => {
    const endpointURL = getPathnameBase()+endpointName;
    return '    <li><a href="'+endpointURL+'">'+endpointURL+'</a></li>'
  })
  .join('\n')
}
</ul>
`;
    return getHtmlWrapper(
      htmlBody,
      [
        "This page exists only in development.",
        "That is when <code>[undefined, 'development'].includes(process.env.NODE_ENV)</code> on the server.",
      ].join('\n')
    );
  }

  function getPathnameBase() {
    return options.apiUrlBase || DEFAULT_API_URL_BASE;
  }
}

function isNodejs() {
  return typeof "process" !== "undefined" && process && process.versions && process.versions.node;
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
    "But `endpoints['"+endpointName+"']` is "+((endpoint&&endpoint.constructor)?'a ':'')+"`"+(endpoint&&endpoint.constructor)+"`",
  );

  assert_plain_function(
    endpoint,
    "The endpoint `"+endpointName+"`",
  );

  assert.internal(endpointIsValid);

  obj[prop] = value;

  return true;
}

function assert_plain_function(fn, errPrefix) {
  assert.usage(
    !isArrowFunction(fn),
    errPrefix+" is defined as an arrow function.",
    "You cannot use an arrow function (`() => {}`), use a plain function (`function(){}`) instead.",
  );
}

function isCallable(thing) {
  return thing instanceof Function || typeof thing === "function";
}

function isArrowFunction(fn) {
  // https://stackoverflow.com/questions/28222228/javascript-es6-test-for-arrow-function-built-in-function-regular-function
  // https://gist.github.com/brillout/51da4cb90a5034e503bc2617070cfbde

  assert.internal(!yes(function(){}));
  assert.internal(yes(()=>{}));
  assert.internal(!yes(async function(){}));
  assert.internal(yes(async ()=>{}));

  return yes(fn);

  function yes(fn) {
    if( fn.hasOwnProperty("prototype") ) {
      return false;
    }
    const fnStr = fn.toString();
    if( fnStr.startsWith('async') ) {
      return !fnStr.startsWith('async function');
    }
    return true;
  }
}

function isHumanReadableMode({method}) {
  assert.internal(method);
  if( method==='GET' ){
    return true;
  } else {
    return false;
  }
}

function isDev() {
  if( [undefined, 'development'].includes(process.env.NODE_ENV) ){
    return true;
  }
  return false;
}

// TODO - improve this
function getHtml_body(resultObject) {
  const {endpointResult, respObject: {contentType, body, statusCode}} = resultObject;

  const text = (
    contentType==='application/json' ? (
      JSON.stringify(
        (
          (endpointResult && endpointResult instanceof Object) ? (
            endpointResult
          ) : (
            JSON.parse(body)
          )
        ),
        null, 2
      )
    ) : (
      body
    )
  );

  return getHtmlWrapper(
`<h1>API Response</h1>
<pre>
${text}
</pre>
<br/>
<br/>
Status code: <b>${statusCode}</b>
`
  );
}

function getHtml_error(resultObject) {
  const {endpointError, respObject: {statusCode, body}} = resultObject;
  let html__error = (
`<h1>Error</h1>
<h3>Response Body</h3>
${body}
<br/>
<br/>
Status code: <b>${statusCode}</b>`
  );

  if( isDev() ) {
    html__error += (
`<br/>
<br/>
<h3>Original Error</h3>
<pre>
${endpointError && endpointError.stack || endpointError}
</pre>
<small>
(The call stack is shown only in development. That is when <code>[undefined, 'development'].includes(process.env.NODE_ENV)</code> on the server.)
</small>`
    );
  }

  return getHtmlWrapper(html__error);
}

function getHtmlWrapper(htmlBody, note) {
  note = note || [
    "(Showing HTML version because the request's method is <code>GET</code>.",
    "Make a <code>POST</code> request to get JSON instead.)",
  ].join('\n');

  return (
`<html><body>
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
<br/>
<br/>
<small>
${note.split('\n').join('<br/>\n')}
</small>
</body></html>
`
  );
}

function getEndpointsObject() {
  return new Proxy({}, {set: validateEndpoint});
}

function create_requestProps_proxy({requestProps, endpointName, isDirectCall}) {
  const requestProps_proxy = new Proxy(requestProps||{}, {get, set});
  return requestProps_proxy;

  function set(_, prop, newVal) {
    requestProps[prop] = newVal;
    return true;
  }
  function get(_, prop) {
    if( !requestProps ) {
      assert.internal(isDirectCall===true);
      console.log('pp', prop, 'pe');
      const propNameIsNormal = isPropNameNormal(prop);
      assert.usage(false,
        colorizeError("Wrong usage of the Wildcard client in Node.js."),
        ...(
          propNameIsNormal ? [
            "",
            "Cannot get `this."+prop+"` because you didn't provide `"+prop+"`.",
          ] : []
        ),
        "",
        colorizeEmphasis(
          propNameIsNormal ? (
            "Make sure to provide `"+prop+"` by using `bind({"+prop+"})` when calling your `"+endpointName+"` endpoint in Node.js."
          ) : (
            "When using the Wildcard client in Node.js, make sure to use `bind()` in order to provide `requestProps`/`this`."
          )
        ),
        "",
        "More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md",
      );
    }
    assert.internal(requestProps);
    return requestProps[prop];
  }
}

function isPropNameNormal(prop) {
  let propStr;
  try {
    propStr = prop.toString();
  } catch(err) {}

  return propStr===prop && /^[a-zA-Z0-9_]+$/.test(prop);
}

function colorizeError(text) {
  return chalk.bold.red(text);
}
function colorizeEmphasis(text) {
  return chalk.cyan(text);
}
