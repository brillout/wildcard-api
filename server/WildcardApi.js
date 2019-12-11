const assert = require('@brillout/assert');
const {stringify, parse} = require('@brillout/json-s');
const chalk = require('chalk');
const docsUrl = require('./package.json').repository;
const getUrlProps = require('@brillout/url-props');

const API_URL_BASE = '/wildcard/';

assert.usage(
  isNodejs(),
  "You are loading the module `wildcard-api` in the browser.",
  "The module `wildcard-api` is meant for your Node.js server. Load `wildcard-api/client` instead.",
  "That is: `import {endpoints} from 'wildcard-api/client'",
);

module.exports = WildcardApi;

function WildcardApi() {
  const options = this;

  const endpointsObject = getEndpointsObject();

  Object.assign(
    this,
    {
      endpoints: endpointsObject,
      getApiResponse,
      disableEtag: false,
      __directCall,
    },
  );

  return this;

  async function getApiResponse(requestProps, context) {
    const {
      endpointName,
      endpointArgs,
      malformationError,
      isIntrospection,
      isNotWildcardRequest,
      isHumanMode,
    } = RequestInfo({requestProps, context, endpointsObject});

    if( isNotWildcardRequest ){
      return null;
    }
    if( malformationError ){
      return HttpMalformationResponse({malformationError});
    }
    if( isIntrospection ){
      return HttpIntrospectionResponse({endpointsObject});
    }

    const {endpointResult, endpointError} = await runEndpoint({endpointName, endpointArgs, context, isDirectCall: false});

    if( endpointError ){
      logError({endpointError, endpointName});
      return HttpErrorResponse({endpointError, isHumanMode});
    }

    const responseProps = await HttpResponse({endpointResult, isHumanMode});

    if( !options.disableEtag ){
      const computeEtag = require('./computeEtag');
      const etag = computeEtag(responseProps.body);
      assert.internal(etag);
      responseProps.etag = etag;
    }

    return responseProps;
  }

  async function __directCall({endpointName, endpointArgs, context}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);

    assert.usage(
      endpointExists({endpointName, endpointsObject}),
      getNoEndpointError({endpointName, endpointsObject, calledInBrowser: false}),
    );

    const resultObject = await runEndpoint({endpointName, endpointArgs, context, isDirectCall: true});

    const {endpointResult, endpointError} = resultObject;

    if( endpointError ) {
      throw endpointError;
    } else {
      return endpointResult;
    }
  }

  async function runEndpoint({endpointName, endpointArgs, context, isDirectCall}) {
    assert.internal(endpointName);
    assert.internal(endpointArgs.constructor===Array);
    assert.internal([true, false].includes(isDirectCall));

    const endpoint = endpointsObject[endpointName];
    assert.internal(endpoint);
    assert.internal(endpointIsValid(endpoint));

    const requestProps_proxy = create_requestProps_proxy({context, endpointName, isDirectCall});

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

    return {endpointResult, endpointError};
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
  assert.internal(method && method.toUpperCase()===method);
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
function get_human_response({responseProps, endpointResult}) {
  const text = (
    responseProps.contentType==='application/json' ? (
      JSON.stringify(
        (
          (endpointResult && endpointResult instanceof Object) ? (
            endpointResult
          ) : (
            JSON.parse(responseProps.body)
          )
        ),
        null, 2
      )
    ) : (
      responseProps.body
    )
  );

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

function get_human_error_response({responseProps, endpointError}) {
  let html__error = (
`<h1>Error</h1>
<h3>Response Body</h3>
${responseProps.body}
<br/>
<br/>
Status code: <b>${responseProps.statusCode}</b>`
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

  return get_html_response(html__error);
}

function get_html_response(htmlBody, note) {
  note = note || [
    "(Showing HTML version because the request's method is <code>GET</code>.",
    "Make a <code>POST</code> request to get JSON instead.)",
  ].join('\n');

  const body = (
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

  const responseProps = {
    body,
    contentType: 'text/html',
    statusCode: 200,
  };

  return responseProps;
}

function getEndpointsObject() {
  return new Proxy({}, {set: validateEndpoint});
}

function create_requestProps_proxy({context, endpointName, isDirectCall}) {
  const requestProps_proxy = new Proxy(context||{}, {get, set});
  return requestProps_proxy;

  function set(_, prop, newVal) {
    context[prop] = newVal;
    return true;
  }
  function get(_, prop) {
    if( !context ) {
      assert.internal(isDirectCall===true);
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
            "When using the Wildcard client in Node.js, make sure to use `bind()` in order to provide `context`/`this`."
          )
        ),
        "",
        "More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md",
      );
    }
    assert.internal(context);
    return context[prop];
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

function isPathanameBase({pathname}) {
  return (
    [
      API_URL_BASE,
      API_URL_BASE.slice(0, -1)
    ].includes(pathname)
  );
}

function RequestInfo({requestProps, context, endpointsObject}) {
  const method = requestProps.method.toUpperCase();

  assert_request({requestProps, method});

  const urlProps = getUrlProps(requestProps.url)
  assert.internal(urlProps.pathname.startsWith('/'));

  const {pathname} = urlProps;
  const {body} = requestProps;
  const isHumanMode = isHumanReadableMode({method});

  if(
    !['GET', 'POST'].includes(method) ||
    !isPathanameBase({pathname}) && !pathname.startsWith(API_URL_BASE)
  ){
    return {isNotWildcardRequest: true, isHumanMode};
  }
  if( isPathanameBase({pathname}) && isDev() && isHumanMode ){
    return {isIntrospection: true, isHumanMode};
  }

  const {
    pathname__malformationError,
    endpointName,
    urlArgs,
    pathname__prettified,
  } = parsePathname({pathname});

  if( ! endpointExists({endpointName, endpointsObject}) ) {
    return {
      malformationError: {
        endpointDoesNotExist: true,
        text: getNoEndpointError({endpointName, endpointsObject, calledInBrowser: true}),
      },
      isHumanMode,
    };
  }

  if( pathname__malformationError ){
    return {
      malformationError: pathname__malformationError,
      isHumanMode,
    };
  }

  const {endpointArgs, malformationError} = getEndpointArgs({urlArgs, body, method, pathname__prettified});
  if( malformationError ){
    return {malformationError, isHumanMode};
  }
  assert.internal(endpointArgs.constructor===Array);

  return {endpointArgs, endpointName, isHumanMode};
}

function getEndpointArgs({urlArgs, body, method, pathname__prettified}){
  assert.internal(['GET', 'POST'].includes(method));
  assert.internal(!(method==='GET' && body));
  assert.internal(!(method==='POST' && !body));
  assert.internal(!body || [Array, String].includes(body.constructor));
  let endpointArgsString = urlArgs || JSON.stringify(body);
  let endpointArgs;
  if( endpointArgsString ){
    try {
      endpointArgs = parse(endpointArgsString);
    } catch(err_) {
      return {
        malformationError: {
          text: [
            'Malformatted API URL `'+pathname__prettified+'`.',
            "JSON Parse Error:",
            err_.message,
            "Argument string:",
            endpointArgsString,
            "Couldn't JSON parse the argument string.",
            "Is the argument string a valid JSON?",
          ].join('\n'),
        },
      };
    }
  }

  endpointArgs = endpointArgs || [];

  if( endpointArgs.constructor!==Array ) {
    return {
      malformationError: {
        text: [
          'Malformatted API URL `'+pathname__prettified+'`.',
          'API URL arguments (i.e. endpoint arguments) should be an array.',
          "Instead we got `"+endpointArgs.constructor+"`.",
          'API URL arguments: `'+endpointArgsString+'`',
        ].join('\n'),
      },
    };
  }

  return {endpointArgs};
}


function HttpIntrospectionResponse({endpointsObject}) {
  return {
    statusCode: 200,
    contentType: 'text/html',
    body: getListOfEndpoints({endpointsObject}),
  };
}
function getListOfEndpoints({endpointsObject}) {
  const htmlBody = `
Endpoints:
<ul>
${
getEndpointNames({endpointsObject})
.map(endpointName => {
  const endpointURL = API_URL_BASE+endpointName;
  return '    <li><a href="'+endpointURL+'">'+endpointURL+'</a></li>'
})
.join('\n')
}
</ul>
`;
  return get_html_response(
    htmlBody,
    [
      "This page exists only in development.",
      "That is when <code>[undefined, 'development'].includes(process.env.NODE_ENV)</code> on the server.",
    ].join('\n')
  );
}
function getEndpointNames({endpointsObject}) {
  return Object.keys(endpointsObject);
}

function HttpErrorResponse({endpointError, isHumanMode}) {
  const responseProps = {
    body: 'Internal Server Error',
    statusCode: 500,
    contentType: 'text/plain',
  };
  if( isHumanMode ){
    return get_human_error_response({responseProps, endpointError});
  } else {
    return responseProps;
  }
}
function HttpResponse({endpointResult, isHumanMode}) {
  const responseProps = {
    statusCode: 200,
    contentType: 'application/json',
  };
  let endpointError;
  // TODO be able to stringify undefined instead of null
  const valueToStringify = endpointResult===undefined ? null : endpointResult;
  try {
    responseProps.body = stringify(valueToStringify);
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
  if( endpointError ){
    return HttpErrorResponse({endpointError, isHumanMode});
  }
  if( isHumanMode ){
    return get_human_response({responseProps});
  } else {
    return responseProps;
  }
}

function HttpMalformationResponse({malformationError}) {
  return {
    statusCode: malformationError.endpointDoesNotExist ? 404 : 400,
    contentType: 'text/plain',
    body: malformationError.text,
  };
}

function parsePathname({pathname}){
  assert.internal(pathname.startsWith(API_URL_BASE));
  const urlParts = pathname.slice(API_URL_BASE.length).split('/');

  const isMalformatted = urlParts.length<1 || urlParts.length>2 || !urlParts[0];

  const endpointName = urlParts[0];
  const urlArgs = urlParts[1] && decodeURIComponent(urlParts[1]);
  const pathname__prettified = isMalformatted ? pathname : '/wildcard/'+endpointName+'/'+urlArgs;
  let pathname__malformationError;
  if( isMalformatted ){
    pathname__malformationError = {
      text: [
        'Malformatted API URL `'+pathname__prettified+'`',
        'API URL should have following format: `/wildcard/yourEndpointName/["the","endpoint","arguments"]` (or with URL encoding: `%5B%22the%22%2C%22endpoint%22%2C%22arguments%22%5D`)',
      ].join('\n'),
    };
  }

  return {
    pathname__malformationError,
    endpointName,
    urlArgs,
    pathname__prettified,
  };
}

function assert_request({requestProps, method}) {
  const correctUsage = (
    requestProps.isUniversalAdapter ? [] : [
      [
        "Usage:",
        "",
        "  `const apiResponse = await getApiResponse({method, url, body}, context);`",
        "",
        "where",
        "  - `method` is the HTTP method of the request",
        "  - `url` is the HTTP URL of the request",
        "  - `body` is the HTTP body of the request",
        "  - `req` are optional additional request information such as HTTP headers.",
        "",
      ].join('\n')
    ]
  );

  assert.usage(
    requestProps.url,
    ...correctUsage,
    colorizeError("`url` is missing."),
    "(`url=="+requestProps.url+"`)",
    '',
  );

  assert.usage(
    requestProps.method,
    ...correctUsage,
    colorizeError("`method` is missing."),
    "(`method==="+requestProps.method+"`)",
    '',
  );

  const bodyUsageNote = getBodyUsageNote(requestProps);
  let {body} = requestProps;
  const bodyErrMsg = "`body` is missing but it should be the HTTP request body.";
  assert.usage(
    !(method==='POST' && !body),
    ...correctUsage,
    colorizeError(bodyErrMsg),
    bodyUsageNote,
    '',
  );
  assert.usage(
    'body' in requestProps,
    ...correctUsage,
    colorizeError(bodyErrMsg),
    "Note that `requestProps.body` can be `null` or `undefined` but make sure to define it on the `requestProps`, e.g. `requestProps.body = null;`, i.e. make sure that `'body' in requestProps`.",
    '',
  );
  assert.usage(
    !body || [Array, String].includes(body.constructor),
    {body},
    '',
    ...correctUsage,
    colorizeError("Unexpected `body` type: `body` should be a string or an array."),
    "`body.constructor==="+(body && body.constructor.name)+"`",
  );
}
function getBodyUsageNote(requestProps) {
  const expressNote = 'make sure to parse the body, for Express v4.16 and above: `app.use(express.json())`.';
  const koaNote = 'make sure to parse the body, for example: `app.use(require(\'koa-bodyparser\')())`.';
  if( requestProps.isExpressFramework ){
    return 'You seem to be using Express; '+expressNote;
  }
  if( requestProps.isKoaFramework ){
    return 'You seem to be using Koa; '+expressNote;
  }
  if( requestProps.isHapiFramework ){
    assert.internal('body' in requestProps);
    return;
  }
  return (
    [
      'If you are using Express: '+expressNote,
      'If you are using Hapi: no plugin is required and the body is available at `request.payload`.',
      'If you are using Koa: '+koaNote,
    ].join('\n')
  );
}

function logError({endpointError, endpointName}) {
  console.error('');
  console.error(endpointError);
  console.error('');
  console.error(colorizeError('Error thrown by endpoint function `'+endpointName+'`.'))+
  console.error('Error is printed above.');
  console.error('Read the "Error Handling" documentation for how to handle errors.');
  console.error('');
}

function endpointExists({endpointName, endpointsObject}) {
  const endpoint = endpointsObject[endpointName];
  return !!endpoint;
}

function getNoEndpointError({endpointName, endpointsObject, calledInBrowser}) {
  assert.internal([true, false].includes(calledInBrowser));

  const endpointNames = getEndpointNames({endpointsObject});
  const noEndpointsDefined = endpointNames.length===0;
  if( noEndpointsDefined ) {
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
          endpointNames.map(endpointName => '\n - '+endpointName).join('') +
          "\n\n(Make sure that the file that defines `"+endpointName+"` is loaded, i.e. does your code call `require('./path/to/file/defining-"+endpointName+".js'?)`.)" + (
            !calledInBrowser ? '' : '\n\n(The list of endpoints is only shown in development.)'
          )
        )
      )
    );
  }
}
