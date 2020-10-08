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
type EndpointOutput = Promise<EndpointResult | EndpointError>;

type WildcardServer = {
  __directCall: (
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    context: Context
  ) => EndpointOutput;
};

class WildcardClient {
  config: Config;
  endpoints;

  constructor () {
  this.config = getConfigProxy({
    serverUrl: null,
    baseUrl: "/_wildcard_api/",
    argumentsAlwaysInHttpBody: false,
    __INTERNAL_wildcardServer_test: null,
  });

  this.endpoints = getEndpointsProxy(this.config);
  }
}

  function callEndpoint(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    context: Context,
    endpointsProxy,
    config,
  ): EndpointOutput {
    endpointArgs = endpointArgs || [];

    const wildcardServer: WildcardServer = getWildcardServer(config);

    if (wildcardServer) {
      // Server-side usage
      assert(isNodejs());
      return callEndpointDirectly(
        endpointName,
        endpointArgs,
        wildcardServer,
        context
      );
    }

    // Browser-side usage
    // Or cross-server servide-side usage -- server URL is then needed
    assertUsage(
      config.serverUrl || isBrowser(),
      "`config.serverUrl` missing. You are using the Wildcard client in Node.js and on a different server; the `config.serverUrl` configuration is required."
    );

    assertUsage(
      !context,
      [
        "Using `bind` to provide the context object is forbidden on the browser-side.",
        "You should use `bind` only on the server-side.",
        "More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md",
      ].join(" ")
    );

    return callEndpointOverHttp(endpointName, endpointArgs, config);
  }

  function getWildcardServer(config: ConfigPrivate) {
    const wildcardServer__testing = config.__INTERNAL_wildcardServer_test;
    const wildcardServer__serverSideUsage =
      typeof global !== "undefined" &&
      global &&
      global.__INTERNAL_wildcardServer_nodejs;
    const wildcardServer =
      wildcardServer__testing || wildcardServer__serverSideUsage || null;

    // The purpose of providing `wildcardServer` to `wildcardClient` is for server-side client usage.
    // It doesn't make sense to provide `wildcardServer` on the browser-side.
    assert(wildcardServer === null || isNodejs());

    // The whole purpose of providing `wildcardServer` is to be able to call `wildcardServer.__directCall`
    // Bypassing making an unecessary HTTP request.
    assert(wildcardServer === null || wildcardServer.__directCall);

    return wildcardServer;
  }

  function callEndpointDirectly(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    wildcardServer: WildcardServer,
    context: Context
  ): EndpointOutput {
    return wildcardServer.__directCall(endpointName, endpointArgs, context);
  }

  function callEndpointOverHttp(
    endpointName: EndpointName,
    endpointArgs: EndpointArgs,
    config
  ): EndpointOutput {
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

    let url = getEndpointUrl(endpointName, config);
    if (urlArgs__string) {
      url += "/" + encodeURIComponent(urlArgs__string);
    }

    return makeHttpRequest({ url, parse, body, endpointName });
  }

  function getEndpointUrl(endpointName: EndpointName, config): string {
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


  function getEndpointsProxy(config: Config) {
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
            "The context object you `bind()` should be a `instanceof Object`."
          );
        }

        return callEndpoint(endpointName, endpointArgs, context, endpointsProxy, config);
      };
    }

    function set() {
      assertUsage(
        false,
        [
          "You cannot add/modify endpoint functions with the Wildcard client `@wildcard-api/client`.",
          "Instead, define your endpoint functions with the Wildcard server `@wildcard-api/server`.",
        ].join(" ")
      );

      // Make TS happy
      return false;
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
    assertUsage(
      false,
      [
        `Couldn't serialize arguments for endpoint \`${endpointName}\`.`,
        `Make sure all arguments passed to \`${endpointName}()\``,
        "are only of the following types:",
        "`Object`, `string`, `number`, `Date`, `null`, `undefined`, `Inifinity`, `NaN`, `RegExp`.",
      ].join(" ")
    );
  }
  return serializedArgs;
}

function getConfigProxy(configDefaults: ConfigPrivate) {
  return new Proxy({ ...configDefaults }, { set: validateConfig });

  function validateConfig(
    obj: ConfigPrivate,
    configName: string,
    configValue: any
  ) {
    validateConfigExistence(configName);
    if (configName === "serverUrl") {
      const serverUrl = configValue;
      validateServerUrl(serverUrl);
    }
    return (obj[configName] = configValue);
  }

  function validateConfigExistence(configName: string) {
    assertUsage(
      configName in configDefaults,
      [
        `Unkown config \`${configName}\`.`,
        "Make sure that the config is a `@wildcard-api/client` config",
        "and not a `@wildcard-api/server` one.",
      ].join(" ")
    );
  }
}
function validateServerUrl(serverUrl: string) {
  assertUsage(
    serverUrl === null ||
      // Should be an HTTP URL
      (serverUrl &&
        serverUrl.startsWith &&
        (serverUrl.startsWith("http") ||
          // Or an IP address
          /^\d/.test(serverUrl))),
    `You set \`config.serverUrl==${serverUrl}\` but it should be an HTTP address.`
  );
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
