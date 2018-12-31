const assert = require('reassert');

const DEFAULT_API_URL_BASE = '/wildcard/';

module.exports = {WildcardClient};

function WildcardClient({
  makeHttpRequest,
  apiUrlBase=DEFAULT_API_URL_BASE,
  wildcardApi,
  stringify,
  parse,
}={}) {

  assert.usage(
    makeHttpRequest,
    "You need to provide `makeHttpRequest`: `new WildcardClient({makeHttpRequest})`.",
  );
  assert.usage(
    stringify,
    "You need to provide `stringify`: `new WildcardClient({stringify})`.",
  );
  assert.usage(
    parse,
    "You need to provide `parse`: `new WildcardClient({parse})`.",
  );

  const isCalledByProxy = Symbol();

  return {
    fetchEndpoint,
    endpoints: getEndpointsProxy(),
  };

  async function fetchEndpoint(endpointName, endpointArgs, wildcardApiArgs, ...restArgs) {
    wildcardApiArgs = wildcardApiArgs || {};
    endpointArgs = endpointArgs || [];

    const {context, serverRootUrl} = wildcardApiArgs;

    const wildcardApiFound = wildcardApi || typeof global !== "undefined" && global && global.__globalWildcardApi;
    const runDirectlyWithoutHTTP = !!wildcardApiFound;

    validateArgs({endpointName, endpointArgs, wildcardApiArgs, restArgs, wildcardApiFound, runDirectlyWithoutHTTP});

    if( runDirectlyWithoutHTTP ) {
      assert.internal(isNodejs());
      return wildcardApiFound.__directCall({endpointName, endpointArgs, context});
    } else {
      assert.internal(!context);
      const url = getUrl({endpointName, endpointArgs, serverRootUrl});
      const responseText = await makeHttpRequest({url});
      const responseObject = parse(responseText);
      return responseObject;
    }
  }

  // TODO-eventually improve error messages
  function validateArgs({endpointName, endpointArgs, wildcardApiArgs, restArgs, wildcardApiFound, runDirectlyWithoutHTTP}) {
    assert.internal(wildcardApiArgs);
    const fetchEndpoint__validArgs = (
      endpointName &&
      endpointArgs.constructor===Array,
      restArgs.length===0,
      wildcardApiArgs.constructor===Object &&
      Object.keys(wildcardApiArgs).every(arg => ['context', 'serverRootUrl', isCalledByProxy].includes(arg))
    );

    if( wildcardApiArgs[isCalledByProxy] ) {
      assert.internal(fetchEndpoint__validArgs);
    } else {
      assert.usage(
        fetchEndpoint__validArgs,
        "Usage:"+
        "",
        "  `fetchEndpoint(endpointName, endpointArgs, {context, serverRootUrl})`",
        "",
        "    Where:",
        "      - `endpointName` is the name of the endpoint (required string)",
        "      - `endpointArgs` is the argument list of the endpoint (optional array)",
        "      - `context` is an object holding contextual information (optional object)",
        "      - `serverRootUrl` is the URL root of the server (optional string)",
        "",
        "    Examples:",
        "      `fetchEndpoint('getTodos')`",
        "      `fetchEndpoint('getTodos', [{tags: ['food']}, {onlyCompleted: true}])`",
      );
    }

    const {context} = wildcardApiArgs;
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
        "You are providing the `wildcardApi` parameter to `new WildcardClient({wildcardApi})`.",
        "But `wildcardApi` doesn't seem to be a instance of `new WildcardApi()`.",
      );
    } else {
      assert.usage(
        Object.keys(context||{}).length===0,
        "Wrong SSR usage.",
        "You are:",
        "  - Fetching an API endpoint over HTTP",
        "  - Providing a context object",
        "But you should provide a context only while doing server-side rendering.",
        "(Providing a context object is obsolete on the browser-side since the HTTP request will be the context and would override any context you provide.)",
      );
    }
  }

  function getUrl({endpointName, endpointArgs, serverRootUrl}) {
    serverRootUrl = serverRootUrl || '';
    if( serverRootUrl.endsWith('/') ) {
      serverRootUrl = serverRootUrl.slice(0, -1);
    }
    assert.usage(
      apiUrlBase && apiUrlBase.length>0 && apiUrlBase.startsWith,
      "Argument `apiUrlBase` in `new WildcardClient({apiUrlBase})` should be a non-empty string."
    );
    if( !apiUrlBase.endsWith('/') ) {
      apiUrlBase += '/';
    }
    if( !apiUrlBase.startsWith('/') ) {
      apiUrlBase = '/'+apiUrlBase;
    }

    let endpointArgsStr = serializeArgs({endpointArgs, endpointName, stringify});
    endpointArgsStr = endpointArgsStr ? ('/'+encodeURIComponent(endpointArgsStr)) : '';

    assert.internal(apiUrlBase.startsWith('/') && apiUrlBase.endsWith('/'));
    assert.internal(!serverRootUrl.startsWith('/'));
    assert.internal(!endpointArgsStr || endpointArgsStr.startsWith('/'));
    const url = serverRootUrl+apiUrlBase+endpointName+endpointArgsStr;

    const urlRootIsMissing = !serverRootUrl && makeHttpRequest.isUsingBrowserBuiltIn && !makeHttpRequest.isUsingBrowserBuiltIn();
    if( urlRootIsMissing ) {
      assert.internal(isNodejs());
      assert.usage(
        false,
        [
          "Trying to fetch `"+url+"` from Node.js.",
          "But the URL root is missing.",
          "In Node.js URLs need to include the URL root.",
          "Use the `serverRootUrl` parameter. E.g. `fetchEndpoint('getTodos', {onlyCompleted: true}, {serverRootUrl: 'https://api.example.org'});`.",
        ].join('\n')
      );
    }

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
        const noContext = (
          this===proxy ||
          this===undefined ||
          typeof window !== "undefined" && this===window ||
          typeof global !== "undefined" && this===global
        );
        const context = noContext ? undefined : this;
        return fetchEndpoint(prop, endpointArgs, {context, [isCalledByProxy]: true});
      };
    }

    function set(){
      assert.usage(
        false,
        "You cannot add/modify endpoint functions on the client.",
        "Instead, define your endpoint functions on the server:",
        "    const {endpoints} = require('wildcard-api');",
        "    endpoints.newEndpoint = function(){return 'hello'};",
        "Note that `endpoints` is loaded from `require('wildcard-api')` and not `require('wildcard-api/client')`.",
      );
    }
  }
}

function isNodejs() {
  return typeof "process" !== "undefined" && process && process.versions && process.versions.node;
}

function assertProxySupport() {
  assert.usage(
    envSupportsProxy(),
    [
      "This JavaScript environment doesn't seem to support Proxy.",
      "Use `fetchEndpoint` instead of `endpoints`.",
      "",
      "Note that all browsers support Proxy with the exception of Internet Explorer.",
      "If you want to support IE then use `fetchEndpoint` instead.",
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
