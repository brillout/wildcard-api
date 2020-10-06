import { printDonationReminder } from "@lsos/donation-reminder";
import { stringify, parse } from "@brillout/json-s";
import { makeHttpRequest } from "./makeHttpRequest";
import { assert, assertUsage, setProjectInfo } from "@brillout/assert";

export { WildcardClient };

setProjectInfo({
  projectName: "Wildcard API",
  projectGithub: "https://github.com/reframejs/wildcard-api",
});

printDonationReminder({
  npmName: "@wildcard-api",
  projectName: "Wildcard API",
  donationText:
    "Servus :beers:, I'm Romuald, any gesture is greatly appreciated! :heart:",
  minNumberOfAuthors: 0,
});

assertProxySupport();

type Config = {
  serverUrl?: string;
  baseUrl: string;
  argumentsAlwaysInHttpBody: boolean;
};

type ConfigPrivate = Config & {
  __INTERNAL_wildcardServer_test: any;
};

type EndpointName = string & { _brand?: "EndpointName" };
type EndpointArgs = string[] & { _brand?: "EndpointArgs" };
type Context = object & { _brand?: "Context" };
type EndpointResult = unknown & { _brand?: "EndpointResult" };
type EndpointError = Error & { _brand?: "EndpointError" };
type EndpointOutcome = Promise<EndpointResult | EndpointError>;

type WildcardServer = {
  __directCall: (
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    context: Context
  ) => EndpointOutcome;
};

function WildcardClient(): void {
  const config = getConfigProxy({
    serverUrl: null,
    baseUrl: "/_wildcard_api/",
    argumentsAlwaysInHttpBody: false,
    __INTERNAL_wildcardServer_test: null,
  });

  Object.assign(this, {
    endpoints: getEndpointsProxy(),
    config: config as Config,
  });

  return this;

  function callEndpoint(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    context: Context
  ): EndpointOutcome {
    endpointArgs = endpointArgs || [];

    const wildcardServer: WildcardServer =
      config.__INTERNAL_wildcardServer_test ||
      (typeof global !== "undefined" &&
        global &&
        global.__INTERNAL_wildcardServer_nodejs);
    const runDirectlyWithoutHTTP = !!wildcardServer;

    validateArgs({
      endpointName,
      endpointArgs,
      context,
      wildcardServer,
      runDirectlyWithoutHTTP,
    });

    if (runDirectlyWithoutHTTP) {
      assert(isNodejs());
      return callEndpointDirectly(
        endpointName,
        endpointArgs,
        wildcardServer,
        context
      );
    } else {
      assert(!context);
      assert_serverUrl(config.serverUrl);
      return callEndpointOverHttp(endpointName, endpointArgs);
    }
  }

  function callEndpointDirectly(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    wildcardServer: WildcardServer,
    context: Context
  ): EndpointOutcome {
    return wildcardServer.__directCall(endpointName, endpointArgs, context);
  }

  function callEndpointOverHttp(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs
  ): EndpointOutcome {
    let body: string;
    let urlArgs__string: string;
    const ARGS_IN_BODY = "args-in-body";
    let endpointArgsStr = serializeArgs(endpointArgs, endpointName);
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

    let url = getEndpointUrl(endpointName);
    if (urlArgs__string) {
      url += "/" + encodeURIComponent(urlArgs__string);
    }

    return makeHttpRequest({ url, parse, body, endpointName });
  }

  // TODO-eventually improve error messages
  function validateArgs({
    endpointName,
    endpointArgs,
    context,
    wildcardServer,
    runDirectlyWithoutHTTP,
  }) {
    const fetchEndpoint__validArgs =
      endpointName && endpointArgs.constructor === Array;
    assert(fetchEndpoint__validArgs);

    if (runDirectlyWithoutHTTP) {
      const errorIntro = [
        "You are trying to run an endpoint directly.",
        "(Instead of doing an HTTP request).",
      ].join("\n");
      assertUsage(
        isNodejs(),
        [
          errorIntro,
          "But you are trying to do so in the browser which doesn't make sense.",
          "Running endpoints directly should be done in Node.js only.",
        ].join("\n")
      );
      assertUsage(
        wildcardServer.__directCall,
        [
          errorIntro,
          "You are providing the `__INTERNAL_wildcardServer_test` option but it isn't an instance of `new WildcardServer()`.",
        ].join("\n")
      );
    } else {
      assertUsage(
        Object.keys(context || {}).length === 0,
        [
          "Wrong SSR usage.",
          "You are:",
          "  - Using the Wildcard client on the browser-side",
          "  - Manually providing the `context` object (you are using `bind`)",
          "But you should manually provide the `context` object only on the server-side while doing server-side rendering.",
          "More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md",
        ].join("\n")
      );
    }
  }

  function getEndpointUrl(endpointName: EndpointName): string {
    let url: string;

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
    const emptyObject = {};

    const endpointsProxy = new Proxy(emptyObject, { get, set });
    return endpointsProxy;

    function get({}, endpointName: EndpointName) {
      //*
      // Return native methods
      if (endpointName in emptyObject) {
        return emptyObject[endpointName];
      }

      // We assume `endpointName` to always be a string
      if (typeof endpointName !== "string") {
        return undefined;
      }

      // TODO handle this more properly
      // Ideally: throw a usage error
      // But: `inspect` seems to be called automatically (by Node.js if I remember correclty)
      // Hence I'm not sure how to handle this. Maybe by checking if the caller is Node.js or the user.
      if (endpointName === "inspect") {
        return undefined;
      }
      //*/

      if (typeof endpointName !== "string") {
        return undefined;
      }

      return function (...endpointArgs: EndpointArgs) {
        let context: Context = undefined;
        if (isBinded(this, endpointsProxy)) {
          context = this;
          assert(context !== emptyObject);
          assert(context !== endpointsProxy);
          assertUsage(
            context instanceof Object,
            `You should \`bind(obj)\` an endpoint with an object(-like) \`obj\`. Instead you called \`bind(obj)\` with \`obj==${context}\`.`
          );
        }

        return callEndpoint(endpointName, endpointArgs, context);
      };
    }

    function set() {
      assertUsage(
        false,
        [
          "You cannot add/modify endpoint functions with the client module `@wildcard-api/client`.",
          "Instead, define your endpoint functions with the `@wildcard-api/server` module:",
          "    const {endpoints} = require('@wildcard-api/server');",
          "    endpoints.newEndpoint = function(){return 'hello'};",
          "Note how we load `endpoints` from `require('@wildcard-api/server')` and not `require('@wildcard-api/client')`.",
        ].join("\n")
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
      "Your JavaScript environment doesn't seem to support Proxy.",
      "Note that all browsers and Node.js support Proxy, with the exception of Internet Explorer.",
      "If you need IE support then open a GitHub issue.",
    ].join(" ")
  );
}
function envSupportsProxy() {
  return typeof "Proxy" !== "undefined";
}

function serializeArgs(
  endpointArgs: EndpointArgs,
  endpointName: EndpointName
): string {
  assert(endpointArgs.length >= 0);
  if (endpointArgs.length === 0) {
    return undefined;
  }
  let serializedArgs: string;
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
      [
        "Couldn't serialize arguments for `" + endpointName + "`.",
        "The endpoint arguments in question and the serialization error are printed above.",
      ].join("\n")
    );
  }
  return serializedArgs;
}

function assert_serverUrl(serverUrl: string) {
  assertUsage(
    serverUrl === null ||
      // Should be an HTTP URL
      (serverUrl &&
        serverUrl.startsWith &&
        (serverUrl.startsWith("http") ||
          // Or an IP address
          /^\d/.test(serverUrl))),
    "You provided a wrong value for the option `serverUrl`."
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
      [
        `Unkown config \`${prop}\`.`,
        "Make sure that the config is a `@wildcard-api/client` config",
        "and not a `@wildcard-api/server` one.",
      ].join(" ")
    );
    return (obj[prop] = value);
  }
}

function isBinded(that: unknown, defaultBind: unknown): boolean {
  // Old webpack version: `this===undefined`
  // New webpack version: `this===global`
  // Parcel: `this===window`
  // Node.js: `this===global`, or `this===undefined` (https://stackoverflow.com/questions/22770299/meaning-of-this-in-node-js-modules-and-functions)
  // Chrome (without bundler): `this===window`

  assertUsage(
    (function () {
      return notBinded(this);
    })() === true,
    "You seem to be using `@wildcard-api/client` with an unknown environment/bundler; the following environemnts/bundlers are supported: webpack, Parcel, and Node.js. Open a new issue at https://github.com/reframejs/wildcard-api/issues/new for adding support for your environemnt/bundler."
  );

  return !notBinded(that, defaultBind);

  function notBinded(that: unknown, defaultBind?: unknown) {
    return (
      that === undefined ||
      (defaultBind && that === defaultBind) ||
      (typeof window !== "undefined" && that === window) ||
      (typeof global !== "undefined" && that === global)
    );
  }
}

declare global {
  namespace NodeJS {
    interface Global {
      __INTERNAL_wildcardServer_nodejs: any;
    }
  }
}
