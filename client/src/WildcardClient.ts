import { printDonationReminder } from "@lsos/donation-reminder";
import { stringify, parse } from "@brillout/json-s";
import { makeHttpRequest } from "./makeHttpRequest";
import { assert, assertUsage, setProjectInfo } from "@brillout/assert";

export { WildcardClient };

setProjectInfo({
  projectName: "@wildcard-api",
  projectGithub: "https://github.com/reframejs/wildcard-api",
  projectDocs: "https://github.com/reframejs/wildcard-api",
});

printDonationReminder({
  npmName: "@wildcard-api",
  projectName: "Wildcard API",
  donationText:
    "Servus :beers:, I'm Romuald, any gesture is greatly appreciated! :heart:",
  minNumberOfAuthors: 0,
});

type Config = {
  serverUrl?: string;
  baseUrl: string;
  argumentsAlwaysInHttpBody: boolean;
};

type ConfigPrivate = Config & {
  __INTERNAL__wildcardServer: any;
};

const IS_CALLED_BY_PROXY = Symbol();

function WildcardClient(): void {
  const config = getConfigProxy({
    serverUrl: null,
    baseUrl: "/_wildcard_api/",
    argumentsAlwaysInHttpBody: false,
    __INTERNAL__wildcardServer: null,
  });

  Object.assign(this, {
    endpoints: getEndpointsProxy(),
    config: config as Config,
  });

  return this;

  function fetchEndpoint(endpointName, endpointArgs, generalArgs, ...restArgs) {
    generalArgs = generalArgs || {};
    endpointArgs = endpointArgs || [];

    const { context } = generalArgs;

    const wildcardServerFound =
      config.__INTERNAL__wildcardServer ||
      (typeof global !== "undefined" &&
        global &&
        global.__globalWildcardServer);
    const runDirectlyWithoutHTTP = !!wildcardServerFound;

    validateArgs({
      endpointName,
      endpointArgs,
      generalArgs,
      restArgs,
      wildcardServerFound,
      runDirectlyWithoutHTTP,
    });

    if (runDirectlyWithoutHTTP) {
      assert(isNodejs());
      return callEndpointDirectly({
        endpointName,
        endpointArgs,
        wildcardServerFound,
        context,
      });
    } else {
      assert(!context);
      assert_serverUrl(config.serverUrl);
      return callEndpointOverHttp({ endpointName, endpointArgs });
    }
  }

  function callEndpointDirectly({
    endpointName,
    endpointArgs,
    wildcardServerFound,
    context,
  }) {
    return wildcardServerFound.__directCall({
      endpointName,
      endpointArgs,
      context,
    });
  }

  function callEndpointOverHttp({ endpointName, endpointArgs }) {
    let body;
    let urlArgs__string;
    const ARGS_IN_BODY = "args-in-body";
    let endpointArgsStr = serializeArgs({
      endpointArgs,
      endpointName,
      stringify,
    });
    if (endpointArgsStr) {
      // https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
      if (endpointArgsStr.length >= 2000 || config.argumentsAlwaysInHttpBody) {
        body = endpointArgsStr;
        urlArgs__string = ARGS_IN_BODY;
      } else {
        urlArgs__string = endpointArgsStr;
        assert(!urlArgs__string.startsWith(ARGS_IN_BODY));
      }
    }

    let url = getEndpointUrl({ endpointName, endpointArgs });
    if (urlArgs__string) {
      url += "/" + encodeURIComponent(urlArgs__string);
    }

    return makeHttpRequest({ url, parse, body });
  }

  // TODO-eventually improve error messages
  function validateArgs({
    endpointName,
    endpointArgs,
    generalArgs,
    restArgs,
    wildcardServerFound,
    runDirectlyWithoutHTTP,
  }) {
    assert(generalArgs);
    const fetchEndpoint__validArgs =
      (endpointName && endpointArgs.constructor === Array,
      restArgs.length === 0,
      generalArgs.constructor === Object &&
        Object.keys(generalArgs).every((arg) =>
          ["context", IS_CALLED_BY_PROXY].includes(arg)
        ));

    if (generalArgs[IS_CALLED_BY_PROXY]) {
      assert(fetchEndpoint__validArgs);
    } else {
      // TODO remove all code related to directly calling `fetchEndpoint`
      assert(false);
      /*
      assertUsage(
        fetchEndpoint__validArgs,
        "Usage:"+
        "",
        "  `fetchEndpoint(endpointName, endpointArgs, {context})`",
        "",
        "    Where:",
        "      - `endpointName` is the name of the endpoint (required string)",
        "      - `endpointArgs` is the argument list of the endpoint (optional array)",
        "      - `context` is the HTTP request object (optional object)",
        "",
        "    Examples:",
        "      `fetchEndpoint('getTodos')`",
        "      `fetchEndpoint('getTodos', [{tags: ['food']}, {onlyCompleted: true}])`",
      );
      */
    }

    const { context } = generalArgs;
    if (runDirectlyWithoutHTTP) {
      const errorIntro = [
        "You are trying to run an endpoint directly.",
        "(Instead of doing an HTTP request).",
      ].join("\n");
      assertUsage(
        isNodejs(),
        errorIntro,
        "But you are trying to do so in the browser which doesn't make sense.",
        "Running endpoints directly should be done in Node.js only."
      );
      assertUsage(
        wildcardServerFound.__directCall,
        errorIntro,
        "You are providing the `__INTERNAL__wildcardServer` option but it isn't an instance of `new WildcardServer()`."
      );
    } else {
      assertUsage(
        Object.keys(context || {}).length === 0,
        "Wrong SSR usage.",
        "You are:",
        "  - Using the Wildcard client on the browser-side",
        "  - Manually providing the `context` object (you are using `bind`)",
        "But you should manually provide the `context` object only on the server-side while doing server-side rendering.",
        "More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md"
      );
    }
  }

  function getEndpointUrl({ endpointName, endpointArgs }) {
    let url;

    const { serverUrl } = config;
    assert(serverUrl || isBrowser());
    if (serverUrl) {
      url = serverUrl;
    } else {
      url = "";
    }

    if (config.baseUrl) {
      if (!url.endsWith("/") && !config.baseUrl.startsWith("/")) {
        url += "/";
      }
      if (url.endsWith("/") && config.baseUrl.startsWith("/")) {
        url = url.slice(0, -1);
        assert("bla/".slice(0, -1) === "bla");
      }
      url += config.baseUrl;
    }

    if (!url.endsWith("/")) {
      url += "/";
    }
    url += endpointName;

    return url;
  }

  function getEndpointsProxy() {
    assertProxySupport();

    const dummyObject = {};

    const proxy = new Proxy(dummyObject, { get, set });
    return proxy;

    function get(target, prop) {
      if (typeof prop !== "string" || prop in dummyObject) {
        return dummyObject[prop];
      }

      // TODO-enventually
      if (prop === "inspect") {
        return undefined;
      }

      // console.log(prop, target===dummyObject, typeof prop, new Error().stack);

      (function () {
        // Webpack: `this===undefined`
        // New webpack version: `this===global`
        // Parcel: `this===window`
        assert(
          this === undefined ||
            (typeof window !== "undefined" && this === window) ||
            (typeof global !== "undefined" && this === global),
          this
        );
      })();

      return function (...endpointArgs) {
        const noBind =
          this === proxy ||
          this === undefined ||
          (typeof window !== "undefined" && this === window) ||
          (typeof global !== "undefined" && this === global);
        const context = noBind ? undefined : this;
        return fetchEndpoint(prop, endpointArgs, {
          context,
          [IS_CALLED_BY_PROXY]: true,
        });
      };
    }

    function set() {
      assertUsage(
        false,
        "You cannot add/modify endpoint functions with the client module `@wildcard-api/client`.",
        "Instead, define your endpoint functions with the `@wildcard-api/server` module:",
        "    const {endpoints} = require('@wildcard-api/server');",
        "    endpoints.newEndpoint = function(){return 'hello'};",
        "Note how we load `endpoints` from `require('@wildcard-api/server')` and not `require('@wildcard-api/client')`."
      );

      // Make TS happy
      return false;
    }
  }
}

function isNodejs() {
  const itIs = __nodeTest();
  assert(itIs === !__browserTest());
  return itIs;
}
function __nodeTest() {
  const nodeVersion =
    typeof process !== "undefined" &&
    process &&
    process.versions &&
    process.versions.node;
  return !!nodeVersion;
}
function isBrowser() {
  const itIs = __browserTest();
  assert(itIs === !__nodeTest());
  return itIs;
}
function __browserTest() {
  return typeof window !== "undefined";
}

function assertProxySupport() {
  assertUsage(
    envSupportsProxy(),
    [
      "This JavaScript environment doesn't seem to support Proxy.",
      "",
      "Note that all browsers support Proxy with the exception of Internet Explorer.",
      "If you want support for IE then open a GitHub issue.",
    ].join("\n")
  );
}
function envSupportsProxy() {
  return typeof "Proxy" !== "undefined";
}

function serializeArgs({ endpointArgs, endpointName, stringify }) {
  assert(endpointArgs.length >= 0);
  if (endpointArgs.length === 0) {
    return undefined;
  }
  let serializedArgs;
  try {
    serializedArgs = stringify(endpointArgs);
  } catch (err_) {
    console.error(err_);
    console.log("\n");
    console.log("Endpoint arguments:");
    console.log(endpointArgs);
    console.log("\n");
    assertUsage(
      false,
      "Couldn't serialize arguments for `" + endpointName + "`.",
      "The endpoint arguments in question and the serialization error are printed above."
    );
  }
  return serializedArgs;
}

function assert_serverUrl(serverUrl) {
  assertUsage(
    serverUrl === null ||
      // Should be an HTTP URL
      (serverUrl &&
        serverUrl.startsWith &&
        (serverUrl.startsWith("http") ||
          // Or an IP address
          /^\d/.test(serverUrl))),
    "You provided a wrong value for the option `serverUrl`.",
    { serverUrl }
  );

  assertUsage(
    serverUrl || isBrowser(),
    "You are running the Wildcard client in Node.js; you need to provide the `serverUrl` option."
  );
}

function getConfigProxy(configDefaults: ConfigPrivate) {
  return new Proxy({ ...configDefaults }, { set: validateNewConfig });

  function validateNewConfig(obj: ConfigPrivate, prop: string, value: any) {
    assertUsage(
      prop in configDefaults,
      `Unkown config \`${prop}\`. Make sure that the config is a \`@wildcard-api/client\` config and not a \`@wildcard-api/server\` one.`
    );
    return (obj[prop] = value);
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      __globalWildcardServer: any;
    }
  }
}
