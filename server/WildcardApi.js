const assert = require('@brillout/reassert');
const defaultSerializer = require('json-s');
const chalk = require('chalk');
const docsUrl = require('../package.json').repository;

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
      wildcardPlug,
      __directCall,
    },
  );

  return options;

  async function getApiResponse(reqObject) {
    assert_reqObject(reqObject);
    const {method, url, body} = reqObject;

    // URL is not a Wildcard URL
    if( ! ['GET', 'POST'].includes(method) ) {
      return null;
    }
    if( !isBase({url}) && !url.startsWith(getUrlBase()) ){
      return null;
    }

    // URL is the wildard root `/wildcard`
    if( isBase({url}) && isDev() && isHumanReadableMode({method}) ){
      return {
        statusCode: 200,
        contentType: 'text/html',
        body: getListOfEndpoints(),
      };
    }

    const {isInvalidUrl, invalidReason, endpointName, endpointArgs} = parseRequest({url, body});

    // URL is invalid
    assert.internal([true, false].includes(isInvalidUrl));
    assert.internal(invalidReason!==undefined);
    if( isInvalidUrl ) {
      assert.internal(invalidReason);
      return {
        statusCode: 404,
        contentType: 'text/plain',
        body: invalidReason,
      };
    }

    const resultObject = await runEndpoint({endpointName, endpointArgs, reqObject, isDirectCall: false});
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

  async function wildcardPlug(reqObject) {
    return getApiResponse(reqObject);
  }

  async function __directCall({endpointName, endpointArgs, reqObject}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);

    assert.usage(
      endpointExists(endpointName),
      'Endpoint '+endpointName+" doesn't exist.",
    );

    const resultObject = await runEndpoint({endpointName, endpointArgs, reqObject, isDirectCall: true});

    const {endpointResult, endpointError} = resultObject;

    if( endpointError ) {
      throw endpointError;
    } else {
      return endpointResult;
    }
  }

  function parseRequest({url, body}) {
    const urlParts = parseUrl(url);
    if( urlParts.length<1 || urlParts.length>2 || !urlParts[0] ) {
      return {
        isInvalidUrl: true,
        invalidReason: 'Malformatted API URL `'+url+'`',
      };
    }

    const endpointName = getEndpointName({url});
    const endpointArgs = getEndpointArgs({url, body});

    if( endpointArgs.constructor!==Array ) {
      return {
        isInvalidUrl: true,
        invalidReason: (
          [
            'Malformatted API URL `'+url+'`.',
            'API URL arguments (i.e. endpoint arguments) should be an array.',
            "Instead we got `"+endpointArgs.constructor+"`.",
            'API URL arguments: `'+endpointArgsString+'`',
          ].join('\n')
        ),
      };
    }

    if( ! endpointExists(endpointName) ) {
      if( noEndpointsDefined() ) {
        console.error(invalidReason);
        return {
          isInvalidUrl: true,
          invalidReason: (
            "You didn't define any endpoint.\n" +
            "Did you load your endpoint definitions `require('./path/to/your/endpoint-functions.js')`?"
          ),
        };
      } else {
        return {
          isInvalidUrl: true,
          invalidReason: (
            'Endpoint '+endpointName+" doesn't exist." + (
              !isDev() ? '' : (
                '\n\nEndpoints: ' +
                getEndpointNames().map(endpointName => '\n - '+endpointName).join('') +
                "\n\n(Make sure that the file that defines `"+endpointName+"` is loaded, i.e. does your code call `require('./path/to/file/defining-"+endpointName+".js'?)`.)"+
                '\n\n(The list of endpoints is only shown in development.)'
              )
            )
          ),
        };
      }
    }

    return {
      isInvalidUrl: false,
      invalidReason: null,
      endpointName,
      endpointArgs,
    };
  }

  function getEndpointName({url}){
    const urlParts = parseUrl(url);
    const endpointName = urlParts[0];
    return endpointName;
  }

  function getEndpointArgs({url, body}){
    const urlParts = parseUrl(url);
    const urlArgs = urlParts[1] && decodeURIComponent(urlParts[1]);
    assert.internal(
      !(urlArgs && body),
      {url, body},
      "Found arguments in both the URL and the HTTP body"
    );
    let endpointArgsString = body || urlArgs;
    let endpointArgs;
    if( endpointArgsString ){
      const parse = options.parse || defaultSerializer.parse;
      try {
        endpointArgs = parse(endpointArgsString);
      } catch(err_) {
        return {
          isInvalidUrl: true,
          invalidReason: (
            [
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
    return endpointArgs;
  }

  function parseUrl(url){
    const urlPath = url.slice(getUrlBase().length);

    const urlParts = urlPath.split('/');

    return urlParts;
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

  function assert_reqObject(reqObject) {
    const {url, method, body} = reqObject;

    const correctUsage = [
      "",
      "Usage:",
      "",
      "  `const apiResponse = await getApiResponse({method, url, body, ...req});`",
      "",
      "where",
      "  - `method` is the HTTP method of the request",
      "  - `url` is the HTTP URL of the request",
      "  - `body` is the HTTP body of the request",
      "  - `req` are optional additional request information such as HTTP headers.",
    ].join('\n');
    assert.usage(
      url,
      "`url` is missing.",
      "(`url=="+url+"`)",
      correctUsage
    );
    assert.usage(
      method,
      "`method` is missing.",
      "(`method==="+method+"`)",
      correctUsage,
    );
    assert.usage(
      'body' in reqObject,
      "You should provide the HTTP request body.",
      "`body` can be `null` or `undefined` but make sure to define it on the `requestProps`, i.e. make sure that `'body' in requestProps`.",
      correctUsage,
    );
    assert.usage(
      !body || body.constructor===String,
      "`body` should be a string.",
      "(`body.constructor==="+(body && body.constructor)+"`)",
      correctUsage,
    );
  }

  async function runEndpoint({endpointName, endpointArgs, reqObject, isDirectCall}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);
    assert.internal([true, false].includes(isDirectCall));

    const endpoint = endpointsObject[endpointName];
    assert.internal(endpoint);
    assert.internal(endpointIsValid(endpoint));

    const reqObject_proxy = create_reqObject_proxy({reqObject, endpointName, isDirectCall});

    let endpointResult;
    let endpointError;

    try {
      endpointResult = await endpoint.apply(
        reqObject_proxy,
        endpointArgs,
      );
    } catch(err) {
      endpointError = err;
    }

    const resultObject = {
      req: reqObject,
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

  function isBase({url}) {
    const urlBase = getUrlBase();
    if( url===urlBase ) {
      return true;
    }
    if( urlBase.endsWith('/') && url===urlBase.slice(0, -1) ) {
      return true;
    }
    return false;
  }
  function getEndpointNames() {
    return Object.keys(endpointsObject);
  }
  function noEndpointsDefined() {
    return getEndpointNames()===0;
  }
  function getListOfEndpoints() {
    const htmlBody = `
Endpoints:
<ul>
${
  getEndpointNames()
  .map(endpointName => {
    const endpointURL = getUrlBase()+endpointName;
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

  function getUrlBase() {
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

function create_reqObject_proxy({reqObject, endpointName, isDirectCall}) {
  const reqObject_proxy = new Proxy(reqObject||{}, {get, set});
  return reqObject;

  function set(_, prop, newVal) {
    reqObject[prop] = newVal;
    return true;
  }
  function get(_, prop) {
    assert_reqObject_prop(prop);
    assert.internal(reqObject);
    return reqObject[prop];
  }

  function assert_reqObject_prop(prop) {
    if( !reqObject ) {
      assert.internal(isDirectCall===true);
      assert.usage(false,
        "Cannot get `this"+getPropString(prop)+"`.",
        "While running the Wildcard client on Node.js.",
        "Make sure to add the request object with `bind`: `endpoints"+getPropString(endpointName)+".bind(req)`.",
      );
    }
  }
}

function getPropString(prop) {
  return (
    /^[a-zA-Z0-9_]+$/.test(prop) ?
      '.'+prop :
      "['"+prop+"']"
  );
}

function colorizeError(text) {
  return chalk.bold.red(text);
}
