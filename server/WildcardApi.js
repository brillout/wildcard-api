const assert = require('reassert');
const defaultSerializer = require('json-s');

const DEFAULT_API_URL_BASE = '/wildcard/';

assert.usage(isNodejs(), "The server-side module should be loaded in Node.js and not in the browser.");

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

  async function getApiResponse(requestContext) {
    assert_context(requestContext);
    const {method, url} = requestContext;

    if( ! ['GET', 'POST'].includes(method) ) {
      return null;
    }
    if( !isBase({url}) && !url.startsWith(getUrlBase()) ){
      return null;
    }

    const contextProxy = await getContextProxy(requestContext);
    assert.internal(contextProxy.body);
    assert.internal(contextProxy.statusCode);
    assert.internal(contextProxy.type);

    if( isHumanReadableMode({url}) ){
      const humanReadableBody = getHumanReadableBody(contextProxy);
      contextProxy.body = humanReadableBody;
      contextProxy.type = 'text/html';
      contextProxy.statusCode = 200;
    }

    return contextProxy;
  }

  function getHumanReadableBody(contextProxy) {
    const {endpointError} = contextProxy;
    if( endpointError ) {
      return getHtml_body(contextProxy);
    } else {
      return getHtml_error(contextProxy);
    }
  }

  async function getContextProxy(context) {
    if( isBase({url}) && isDev({url}) && isHumanReadableMode({method}) ){
      // TODO: also return contextProxy here
      return {
        statusCode: 200,
        type: 'text/html',
        body: getListOfEndpoints(),
      };
    }

    const {isInvalidUrl, invalidReason, endpointArgs} = parseApiUrl({url});
    assert.internal([true, false].includes(isInvalidUrl));
    assert.internal(invalidReason!==undefined);
    if( isInvalidUrl ) {
      assert.internal(invalidReason);
      // TODO: also return contextProxy here
      return {
        statusCode: 400,
        type: 'text/plain',
        body: invalidReason,
      };
    }

    return getResultObject({url, context, endpointArgs});
  }

  async function wildcardPlug(requestContext) {
    return getApiResponse(requestContext);
  }

  async function __directCall({endpointName, endpointArgs, context}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);

    assert.usage(
      endpointExists(endpointName),
      'Endpoint '+endpointName+" doesn't exist.",
    );

    const {endpointResult, endpointError} = await runEndpoint({endpointName, endpointArgs, context, isDirectCall: true});

    if( endpointError ) {
      throw endpointError;
    } else {
      return endpointResult;
    }
  }

  function parseApiUrl({url}) {
    const urlArgs = url.slice(getUrlBase().length);

    const urlParts = urlArgs.split('/');
    if( urlParts.length<1 || urlParts.length>2 || !urlParts[0] ) {
      return {
        isInvalidUrl: true,
        invalidReason: 'Malformatted API URL `'+url+'`',
      };
    }

    const endpointName = urlParts[0];

    const endpointArgsString = urlParts[1] && decodeURIComponent(urlParts[1]);
    let endpointArgs;
    if( endpointArgsString ) {
      const parse = options.parse || defaultSerializer.parse;
      try {
        endpointArgs = parse(endpointArgsString);
      } catch(err_) {
        return {
          isInvalidUrl: true,
          invalidReason: (
            [
              'Malformatted API URL `'+url+'`.',
              "API URL arguments (i.e. endpoint arguments) don't seem to be a JSON.",
              'API URL arguments: `'+endpointArgsString+'`',
            ].join('\n')
          ),
        };
      }
    }
    endpointArgs = endpointArgs || [];

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
      return {
        isInvalidUrl: true,
        invalidReason: 'Endpoint '+endpointName+" doesn't exist.",
      };
    }

    return {
      isInvalidUrl: false,
      invalidReason: null,
      endpointArgs,
    };
  }

  async function getResultObject({url, context, endpointArgs}) {

    const couldNotHandle = {
      err: 'Endpoint could not handle request.',
    };

    const {endpointResult, endpointError, contextProxy} = await runEndpoint({endpointName, endpointArgs, context, isDirectCall: false});

    assert.internal(endpointResult===undefined || endpointError===undefined);
    if( endpointError ) {
      throw endpointError;
    }

    const valueToStringify = endpointResult===undefined ? null : endpointResult;
    const stringify = options.stringify || defaultSerializer.stringify;
    let body;
    try {
      body = stringify(valueToStringify);
    } catch(err_) {
      console.error(err_);
      console.log('\n');
      console.log('Returned value');
      console.log(valueToStringify);
      console.log('\n');
      assert.warning(
        false,
        "Couldn't serialize value returned by endpoint function `"+endpointName+"`.",
        "The returned value in question and the serialization error are printed above.",
      );
      return couldNotHandle;
    }
    assert.internal(body.constructor===String);

    return {body, endpointResult, contextProxy};
  }

  function assert_context(context) {
    const {url, method, headers} = context;

    const correctUsage = [
      "Usage:",
      "",
      "  `const apiResponse = await getApiResponse({method, url, ...context});`",
      "",
      "where",
      "  - `method` is the HTTP method of the request",
      "  - `url` is the HTTP URI of the request",
      "  - `context` are optional additional context information such as logged-in user, HTTP headers, etc.",
    ];
    assert.usage(
      url,
      "Context is missing `url`.",
      "(`url=="+url+"`)",
      "",
      ...correctUsage
    );
    assert.usage(
      method,
      "Context is missing `method`.",
      "(`method=="+method+"`)",
      "",
      ...correctUsage,
    );
    assert.warning(
      headers,
      "Context is missing `headers`."
    );
  }

  async function runEndpoint({endpointName, endpointArgs, context, isDirectCall}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);
    assert.internal([true, false].includes(isDirectCall));

    const endpoint = endpointsObject[endpointName];
    assert.internal(endpoint);
    assert.internal(endpointIsValid(endpoint));

    const contextProxy = createContextProxy({context, endpointName, isDirectCall});

    let endpointResult;
    let endpointError;

    try {
      endpointResult = await endpoint.apply(
        contextProxy,
        endpointArgs,
      )
    } catch(err) {
      endpointError = err;
    }

    if( options.onNewEndpointResult ){
      assert_plain_function(
        options.onNewEndpointResult,
        "`onNewEndpointResult`"
      );
      endpointResult = (
        await options.onNewEndpointResult.call(
          contextProxy,
          {
            endpointName,
            endpointArgs,
            endpointResult,
          },
        )
      );
    }

    return {endpointResult, contextProxy, endpointError};
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
    if( url===urlBase.slice(0, -1) && urlBase.endsWith('/') ) {
      return true;
    }
    return false;
  }
  function getListOfEndpoints() {
    const htmlBody = `
Endpoints:
<ul>
${
  Object.keys(endpointsObject)
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
        "This page only exists in development.",
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
  if( method==='GET' ){
    return true;
  } else {
    return false;
  }
}

function isDev({url}) {
  const {hostname} = new URL(url);
  if( hostname==='localhost' ){
    return true;
  }
  if( [undefined, 'development'].includes(process.env.NODE_ENV) ){
    return true;
  }
  return false;
}

function getHtml_body({endpointResult, type, body, statusCode}) {
  const text = (
    type==='text/json' ? (
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
`<pre>
${text}
</pre>
`
  );
}

function getHtml_error({endpointError, statusCode, body) {
  return getHtmlWrapper(
`<h1>Error</h1>
<h3>Response Body</h3>
$body{}
<h3>Response Status Code</h3>
<h3>Original Error</h3>
${body}`
<pre>
${endpointError}
</pre>
`
  );
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
</style>
${htmlBody}
${getHtmlNote(note)}
</body></html>
`
  );
}

function getHtmlNote(note) {
  return (
`<br/>
<br/>
<small style="color: #777">
${note.split('\n').join('<br/>\n')}
</small>
`
  );
}

function getEndpointsObject() {
  return new Proxy({}, {set: validateEndpoint});
}

function createContextProxy({context, endpointName, isDirectCall}) {
  const contextCopy = {
    ...context,
    __wildcard_originalValues: {},
  };
  const contextProxy = new Proxy(contextCopy, {get, set});
  return contextProxy;

  function set(_, prop, newVal) {
    assert_context('set', prop);
    const oldVal = contextCopy[prop];
    contextCopy.__wildcard_originalValues[prop] = oldVal;
    contextCopy[prop] = newVal;
  }
  function get(_, prop) {
    assert_context('get', prop);
    return contextCopy[prop];
  }

  function assert_context(opName, prop) {
    if( !context ) {
      assert.internal(isDirectCall===true);
      assert.usage(false,
        "Cannot get context `this"+getPropString(prop)+"`.",
        "Context is missing while running the Wildcard client on Node.js.",
        "Make sure to add the request context with `bind`: `endpoints"+getPropString(endpointName)+".bind(requestContext)`.",
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
