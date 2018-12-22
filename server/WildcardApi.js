const assert = require('reassert');
const parse_json_s = require('json-s/parse');
const stringify_json_s = require('json-s/stringify');

const DEFAULT_API_URL_BASE = '/wildcard/';

assert.usage(isNodejs(), "The server-side module should be loaded in Node.js and not in the browser.");

module.exports = WildcardApi;

function WildcardApi({
  apiUrlBase=DEFAULT_API_URL_BASE,
  parse=parse_json_s,
  stringify=stringify_json_s,
}={}) {
  const endpoints__source = {};

  return {
    endpoints: new Proxy(endpoints__source, {set: validateEndpoint}),
    getApiResponse,
    wildcardPlug,
    __directCall,
  };

  async function getApiResponse(requestContext) {
    assert_context(requestContext);

    const {method} = requestContext;
    if( ! ['GET', 'POST'].includes(method) ) return null;

    const {url} = requestContext;

    if( showListOfEndpoints({url, method}) ) {
      return {
        statusCode: 200,
        body: getListOfEndpoints(),
      };
    }

    if( ! url.startsWith(apiUrlBase) ) {
      return null;
    }

    const result = await getResult({url, context: requestContext});

    if( method==='GET' ) {
      if( result.err ) {
        return {
          statusCode: 200,
          body: getHtml_error(result),
        };
      }
      return {
        statusCode: 200,
        body: getHtml_body(result),
      };
    }

    if( method==='POST' ) {
      if( result.err ) {
        return {
          statusCode: result.statusCode || 400,
          body: stringify({usageError: result.err}),
        };
      }

      return {
        statusCode: 200,
        body: result.body,
      };
    }

    assert.internal(false);
  }

  async function wildcardPlug(requestContext) {
    return getApiResponse(requestContext);
  }

  async function __directCall({endpointName, endpointArgs, context}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);
    context = context || getContextErrorProxy(endpointName);

    assert.usage(
      endpointExists(endpointName),
      'Endpoint '+endpointName+" doesn't exist.",
    );

    const endpointRet = await runEndpoint({endpointName, endpointArgs, context});

    return endpointRet;
  }

  async function getResult({url, context}) {
    const urlArgs = url.slice(apiUrlBase.length);

    const urlParts = urlArgs.split('/');
    if( urlParts.length<1 || urlParts.length>2 || !urlParts[0] ) {
      return {err: 'Malformatted API URL `'+url+'`'};
    }
    const endpointName = urlParts[0];

    const endpointArgsString = urlParts[1] && decodeURIComponent(urlParts[1]);
    let endpointArgs;
    if( endpointArgsString ) {
      try {
        endpointArgs = parse(endpointArgsString);
      } catch(err_) {
        return {err: [
          'Malformatted API URL `'+url+'`.',
          "API URL arguments (i.e. endpoint arguments) don't seem to be a JSON.",
          'API URL arguments: `'+endpointArgsString+'`',
        ].join('\n')};
      }
    }
    endpointArgs = endpointArgs || [];

    if( endpointArgs.constructor!==Array ) {
      return {
        err: [
          'Malformatted API URL `'+url+'`.',
          'API URL arguments (i.e. endpoint arguments) should be an array.',
          "Instead we got `"+endpointArgs.constructor+"`.",
          'API URL arguments: `'+endpointArgsString+'`',
        ].join('\n')
      };
    }

    if( ! endpointExists(endpointName) ) {
      return {
        err: 'Endpoint '+endpointName+" doesn't exist.",
        statusCode: 404,
      };
    }

    const couldNotHandle = {
      err: 'Endpoint could not handle request.',
    };

    let endpointReturnedValue;
    try {
      endpointReturnedValue = await runEndpoint({endpointName, endpointArgs, context});
    } catch(err_) {
      console.error(err_);
      return couldNotHandle;
    }

    const valueToStringify = endpointReturnedValue===undefined ? null : endpointReturnedValue;
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
    return {body, endpointReturnedValue};
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

  async function runEndpoint({endpointName, endpointArgs, context}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);

    const endpoint = endpoints__source[endpointName];
    assert.internal(endpoint);
    assert.internal(endpointIsValid(endpoint));

    return (
      await endpoint.apply(
        context,
        endpointArgs,
      )
    );
  }
  function endpointExists(endpointName) {
    const endpoint = endpoints__source[endpointName];
    return !!endpoint;
  }

  function showListOfEndpoints({url, method}) {
    if( ! isDev() ) {
      return false;
    }
    if( method!=='GET') {
      return false;
    }
    if( url===apiUrlBase ) {
      return true;
    }
    if( url===apiUrlBase.slice(0, -1) && apiUrlBase.endsWith('/') ) {
      return true;
    }
    return false;
  }
  function getListOfEndpoints() {
    assert.internal(isDev());
    const htmlBody = `
Endpoints:
<ul>
${
  Object.keys(endpoints__source)
  .map(endpointName => {
    const endpointURL = DEFAULT_API_URL_BASE+endpointName;
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
}

function isNodejs() {
  return typeof "process" !== "undefined" && process && process.versions && process.versions.node;
}

function endpointIsValid(endpoint) {
    return isCallable(endpoint) && !isArrowFunction(endpoint);
}

function isCallable(thing) {
  return thing instanceof Function || typeof thing === "function";
}

function validateEndpoint(obj, prop, value) {
  const endpoints__source = obj;
  const endpoint = value;
  const endpointName = prop;

  assert.usage(
    isCallable(endpoint),
    "An endpoint must be function.",
    "But `endpoints['"+endpointName+"']` is "+((endpoint&&endpoint.constructor)?'a ':'')+"`"+(endpoint&&endpoint.constructor)+"`",
  );

  assert.usage(
    !isArrowFunction(endpoint),
    "The endpoint `"+endpointName+"` is defined with an arrow function.",
    "Endpoints are not allowed to be defined with arrow functions (`() => {}`).",
    "Use a plain function (`function(){}`) instead.",
  );

  assert.internal(endpointIsValid);

  obj[prop] = value;

  return true;
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

function isDev() {
  return [undefined, 'development'].includes(process.env.NODE_ENV);
}

function getHtml_body(result) {
  assert.internal('endpointReturnedValue' in result, result);
  return getHtmlWrapper(
`<pre>
${JSON.stringify(result.endpointReturnedValue, null, 2)}
</pre>
`
  );
}

function getHtml_error(result) {
  return getHtmlWrapper(
`<h1>Error</h1>
${result.err}
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

function getContextErrorProxy(endpointName) {
  return new Proxy({}, {get: (_, prop) => {
    assert.usage(false,
      "Cannot get context `this"+getPropString(prop)+"`.",
      "Context is missing while running the Wildcard client on Node.js.",
      "Make sure to add the request context with `bind`: `endpoints"+getPropString(endpointName)+".bind(requestContext)`.",
    );
  }});
  function getPropString(prop) {
    return (
      /^[a-zA-Z0-9_]+$/.test(prop) ?
        '.'+prop :
        "['"+prop+"']"
    );
  }
}
