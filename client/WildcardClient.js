const assert = require('@brillout/assert');
const {parse, stringify} = require('./serializer');
const makeHttpRequest = require('./makeHttpRequest');

const PATH_NAME_BASE = '/wildcard/';
const IS_CALLED_BY_PROXY = Symbol();

module.exports = WildcardClient;

function WildcardClient() {
  forbidArgs(arguments);

  Object.assign(
    this,
    {
      endpoints: getEndpointsProxy(),
      serverUrl: null,
      argumentsAlwaysInHttpBody: false,
    }
  );

  const options = this;

  return this;

  function fetchEndpoint(endpointName, endpointArgs, wildcardApiArgs, ...restArgs) {
    wildcardApiArgs = wildcardApiArgs || {};
    endpointArgs = endpointArgs || [];

    const {requestProps} = wildcardApiArgs;

    const wildcardApiFound = options.__INTERNAL__wildcardApi || typeof global !== "undefined" && global && global.__globalWildcardApi;
    const runDirectlyWithoutHTTP = !!wildcardApiFound;

    validateArgs({endpointName, endpointArgs, wildcardApiArgs, restArgs, wildcardApiFound, runDirectlyWithoutHTTP});

    if( runDirectlyWithoutHTTP ) {
      assert.internal(isNodejs());
      return callEndpointDirectly({endpointName, endpointArgs, wildcardApiFound, requestProps});
    } else {
      assert.internal(!requestProps);
      assert_serverUrl(options.serverUrl);
      return callEndpointOverHttp({endpointName, endpointArgs});
    }
  }

  function callEndpointDirectly({endpointName, endpointArgs, wildcardApiFound, requestProps}) {
    return wildcardApiFound.__directCall({endpointName, endpointArgs, requestProps});
  }

  function callEndpointOverHttp({endpointName, endpointArgs}) {
    let url = getEndpointUrl({endpointName, endpointArgs});
    let body = stringify([]);

    // Add arguments
    let endpointArgsStr = serializeArgs({endpointArgs, endpointName, stringify});
    if( endpointArgsStr ){
      // https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
      if( endpointArgsStr.length >= 1000 || options.argumentsAlwaysInHttpBody){
        body = endpointArgsStr;
      } else {
        url += '/'+encodeURIComponent(endpointArgsStr);
      }
    }

    return makeHttpRequest({url, parse, body});
  }

  // TODO-eventually improve error messages
  function validateArgs({endpointName, endpointArgs, wildcardApiArgs, restArgs, wildcardApiFound, runDirectlyWithoutHTTP}) {
    assert.internal(wildcardApiArgs);
    const fetchEndpoint__validArgs = (
      endpointName &&
      endpointArgs.constructor===Array,
      restArgs.length===0,
      wildcardApiArgs.constructor===Object &&
      Object.keys(wildcardApiArgs).every(arg => ['requestProps', IS_CALLED_BY_PROXY].includes(arg))
    );

    if( wildcardApiArgs[IS_CALLED_BY_PROXY] ) {
      assert.internal(fetchEndpoint__validArgs);
    } else {
      // TODO remove all code related to directly calling `fetchEndpoint`
      assert.internal(false);
      /*
      assert.usage(
        fetchEndpoint__validArgs,
        "Usage:"+
        "",
        "  `fetchEndpoint(endpointName, endpointArgs, {requestProps})`",
        "",
        "    Where:",
        "      - `endpointName` is the name of the endpoint (required string)",
        "      - `endpointArgs` is the argument list of the endpoint (optional array)",
        "      - `requestProps` is the HTTP request object (optional object)",
        "",
        "    Examples:",
        "      `fetchEndpoint('getTodos')`",
        "      `fetchEndpoint('getTodos', [{tags: ['food']}, {onlyCompleted: true}])`",
      );
      */
    }

    const {requestProps} = wildcardApiArgs;
    if( runDirectlyWithoutHTTP ) {
      const errorIntro = [
        "You are trying to run an endpoint directly.",
        "(Instead of doing an HTTP request).",
      ].join('\n');
      assert.usage(
        isNodejs(),
        errorIntro,
        "But you are trying to do so in the browser which doesn't make sense.",
        "Running endpoints directly should be done in Node.js only.",
      );
      assert.usage(
        wildcardApiFound.__directCall,
        errorIntro,
        "You are providing the `__INTERNAL__wildcardApi` option but it isn't an instance of `new WildcardApi()`."
      );
    } else {
      assert.usage(
        Object.keys(requestProps||{}).length===0,
        "Wrong SSR usage.",
        "You are:",
        "  - Using the Wildcard client on the browser-side",
        "  - Providing `requestProps`",
        "But you should provide `requestProps` only while doing server-side rendering.",
        "(Providing `requestProps` doesn't make sense on browser-side.)",
      );
    }
  }

  function getEndpointUrl({endpointName, endpointArgs}) {
    let url;

    const {serverUrl} = options;
    assert.internal(serverUrl || isBrowser());
    if( serverUrl ) {
      url = serverUrl;
    } else {
      url = '';
    }

    if( PATH_NAME_BASE ) {
      if( !url.endsWith('/') && !PATH_NAME_BASE.startsWith('/') ) {
        url += '/';
      }
      if( url.endsWith('/') && PATH_NAME_BASE.startsWith('/') ) {
        url = url.slice(0, -1);
        assert.internal('bla/'.slice(0, -1)==='bla');
      }
      url += PATH_NAME_BASE;
    }

    if( !url.endsWith('/') ){
      url += '/';
    }
    url += endpointName;

    return url;
  }

  function getEndpointsProxy() {
    assertProxySupport();

    const dummyObject = {};

    const proxy = new Proxy(dummyObject, {get, set});
    return proxy;

    function get(target, prop) {
      if( (typeof prop !== "string") || (prop in dummyObject) ) {
        return dummyObject[prop];
      }

      // TODO-enventually
      if( prop==='inspect' ) {
        return undefined;
      }

   // console.log(prop, target===dummyObject, typeof prop, new Error().stack);

      (function() {
        // Webpack: `this===undefined`
        // New webpack version: `this===global`
        // Parcel: `this===window`
        assert.internal(
          (
            this===undefined ||
            typeof window !== "undefined" && this===window ||
            typeof global !== "undefined" && this===global
          ),
          this,
        );
      })();

      return function(...endpointArgs) {
        const noBind = (
          this===proxy ||
          this===undefined ||
          typeof window !== "undefined" && this===window ||
          typeof global !== "undefined" && this===global
        );
        const requestProps = noBind ? undefined : this;
        return fetchEndpoint(prop, endpointArgs, {requestProps, [IS_CALLED_BY_PROXY]: true});
      };
    }

    function set(){
      assert.usage(
        false,
        "You cannot add/modify endpoint functions with the client module `wildcard-api/client`.",
        "Instead, define your endpoint functions with the `wildcard-api` module:",
        "    const {endpoints} = require('wildcard-api');",
        "    endpoints.newEndpoint = function(){return 'hello'};",
        "Note that you need to load `endpoints` from `require('wildcard-api')` and not `require('wildcard-api/client')`.",
      );
    }
  }
}

function forbidArgs(args) {
  if( args.length===0 ) return;

  const prop = args[0] && Object.keys(args[0]) || 'someOption';
  let val = args[0][prop];
  if( val && val.constructor===String ) {
    val = "'"+val+"'";
  } else if( [null, undefined, true, false].includes(val) || val && val.constructor===Number ){
    val = ''+val;
  } else {
    val = 'someValue';
  }

  assert.usage(
    false,
    "Don't do `const wildcardClient = new WildcardClient({"+prop+": "+val+"});`.",
    "Instead, do `const wildcardClient = new WildcardClient(); wildcardClient."+prop+" = "+val+";",
  );
}

function isNodejs() {
  const itIs = __nodeTest();
  assert.internal(itIs===!__browserTest());
  return itIs;
}
function __nodeTest() {
  const nodeVersion = typeof process !== "undefined" && process && process.versions && process.versions.node;
  return !!nodeVersion;
}
function isBrowser() {
  const itIs = __browserTest();
  assert.internal(itIs===!__nodeTest());
  return itIs;
}
function __browserTest() {
  return typeof window !== 'undefined';
}

function assertProxySupport() {
  assert.usage(
    envSupportsProxy(),
    [
      "This JavaScript environment doesn't seem to support Proxy.",
      "",
      "Note that all browsers support Proxy with the exception of Internet Explorer.",
      "If you want support for IE then open a GitHub issue.",
    ].join('\n')
  );
}
function envSupportsProxy() {
  return typeof "Proxy" !== "undefined";
}

function serializeArgs({endpointArgs, endpointName, stringify}) {
  assert.internal(endpointArgs.length>=0);
  if( endpointArgs.length===0 ) {
    return undefined;
  }
  let serializedArgs;
  try {
    serializedArgs = stringify(endpointArgs);
  } catch(err_) {
    console.error(err_);
    console.log('\n');
    console.log('Endpoint arguments:');
    console.log(endpointArgs);
    console.log('\n');
    assert.usage(
      false,
      "Couldn't serialize arguments for `"+endpointName+"`.",
      "The endpoint arguments in question and the serialization error are printed above.",
    );
  }
  return serializedArgs;
}

function assert_serverUrl(serverUrl) {
  assert.usage(
    serverUrl===null ||
    // Should be an HTTP URL
    serverUrl && serverUrl.startsWith && (serverUrl.startsWith('http') ||
    // Or an IP address
    /^\d/.test(serverUrl)),
    "You provided a wrong value for the option `serverUrl`.",
    {serverUrl}
  );

  assert.usage(
    serverUrl || isBrowser(),
    "You are running the Wildcard client in Node.js; you need to provide the `serverUrl` option."
  );
}
