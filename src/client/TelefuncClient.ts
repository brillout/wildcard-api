// @ts-ignore
import { stringify } from "@brillout/json-s";
import { makeHttpRequest } from "./makeHttpRequest";
import { assert, assertUsage } from "./assert";
import { verify } from "lsos";

export { TelefuncClient };

loadTimeStuff();

// Endpoints
export type TelefunctionName = string;
type TelefunctionArgs = any[];
export type TelefunctionResult = any;
type Telefunction = (...args: TelefunctionArgs) => TelefunctionResult;
type Endpoints = Record<TelefunctionName, Telefunction>;

// Context
type Context = (object & { _brand?: "Context" }) | undefined;

/** Telefunc Client Configuration */
type Config = {
  /** The address of the server, e.g. `https://api.example.org/`. */
  serverUrl: ServerURL;
  /** Make API HTTP requests to `/${baseUrl}/*`. Default: `_telefunc`. */
  baseUrl: string;
  /** Make API HTTP request URLs short: always use the the HTTP request body to transport endpoint arguments (instead of serializing endpoint arguments into the HTTP request URL). */
  shortUrl: boolean;
};
type ServerURL = string | null;
type ConfigPrivate = Config & {
  __INTERNAL_telefuncServer_test: any;
};
type ConfigName = keyof ConfigPrivate;

// Http request
export type HttpRequestUrl = string & { _brand?: "HttpRequestUrl" };
export type HttpRequestBody = string & { _brand?: "HttpRequestBody" };

// Telefunc server instance
// For when using the Telefunc client server-side
type TelefuncServer = {
  __directCall: (
    endpointName: TelefunctionName,
    endpointArgs: TelefunctionArgs,
    context: Context
  ) => // Doesn't have to be a promise; an endpoint can return its value synchronously
  Promise<TelefunctionResult> | TelefunctionResult;
};

const configDefault: ConfigPrivate = {
  serverUrl: null,
  baseUrl: "/_telefunc/",
  shortUrl: false,
  __INTERNAL_telefuncServer_test: null,
};

class TelefuncClient {
  config: Config = getConfigProxy(configDefault);
  endpoints: Endpoints = getEndpointsProxy(this.config as ConfigPrivate);
}

function callEndpoint(
  endpointName: TelefunctionName,
  endpointArgs: TelefunctionArgs,
  context: Context,
  config: ConfigPrivate
): TelefunctionResult {
  endpointArgs = endpointArgs || [];

  const telefuncServer: TelefuncServer = getTelefuncServer(config);

  // Usage in Node.js [inter-process]
  // Inter-process: the Telefunc client and the Telefunc server are loaded in the same Node.js process.
  if (telefuncServer) {
    assert(isNodejs());
    return callEndpointDirectly(
      endpointName,
      endpointArgs,
      telefuncServer,
      context
    );
  }

  // Usage in the browser
  // Usage in Node.js [cross-process]
  // Cross-process: the Telefunc client and the Telefunc server are loaded in different Node.js processes.

  // Server URL is required for cross-process usage
  assertUsage(
    config.serverUrl || isBrowser(),
    "`config.serverUrl` missing. You are using the Telefunc client in Node.js, and the Telefunc client is loaded in a different Node.js process than the Node.js process that loaded the Telefunc server; the `config.serverUrl` configuration is required."
  );

  assertUsage(
    !context,
    [
      "Using `bind` to provide the context object is forbidden on the browser-side.",
      "You should use `bind` only on the server-side.",
      "More infos at https://github.com/telefunc/telefunc/blob/master/docs/ssr-auth.md",
    ].join(" ")
  );

  return callEndpointOverHttp(endpointName, endpointArgs, config);
}

function getTelefuncServer(config: ConfigPrivate) {
  const telefuncServer__testing = config.__INTERNAL_telefuncServer_test;
  const telefuncServer__serverSideUsage =
    typeof global !== "undefined" &&
    global &&
    global.__INTERNAL_telefuncServer_nodejs;
  const telefuncServer =
    telefuncServer__testing || telefuncServer__serverSideUsage || null;

  // The purpose of providing `telefuncServer` to `telefuncClient` is for server-side client usage.
  // It doesn't make sense to provide `telefuncServer` on the browser-side.
  assert(telefuncServer === null || isNodejs());

  // The whole purpose of providing `telefuncServer` is to be able to call `telefuncServer.__directCall`
  // Bypassing making an unecessary HTTP request.
  assert(telefuncServer === null || telefuncServer.__directCall);

  return telefuncServer;
}

async function callEndpointDirectly(
  endpointName: TelefunctionName,
  endpointArgs: TelefunctionArgs,
  telefuncServer: TelefuncServer,
  context: Context
): Promise<TelefunctionResult> {
  return telefuncServer.__directCall(endpointName, endpointArgs, context);
}

function callEndpointOverHttp(
  endpointName: TelefunctionName,
  endpointArgs: TelefunctionArgs,
  config: ConfigPrivate
): TelefunctionResult {
  let body: HttpRequestBody | undefined;
  let urlArgs__string: string | undefined;
  const ARGS_IN_BODY = "args-in-body";
  let endpointArgsStr = serializeArgs(endpointArgs, endpointName);
  if (endpointArgsStr) {
    // https://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
    if (endpointArgsStr.length >= 2000 || config.shortUrl) {
      body = endpointArgsStr;
      urlArgs__string = ARGS_IN_BODY;
    } else {
      urlArgs__string = endpointArgsStr;
      assert(!urlArgs__string.startsWith(ARGS_IN_BODY));
    }
  }

  let url: HttpRequestUrl = getEndpointUrl(endpointName, config);
  if (urlArgs__string) {
    url += "/" + encodeURIComponent(urlArgs__string);
  }

  return makeHttpRequest(url, body, endpointName);
}

function getEndpointUrl(
  endpointName: TelefunctionName,
  config: ConfigPrivate
): HttpRequestUrl {
  let url: HttpRequestUrl = "";

  const { serverUrl } = config;
  assert(serverUrl || isBrowser());
  if (serverUrl) {
    url = serverUrl as string;
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

function getEndpointsProxy(config: ConfigPrivate): Endpoints {
  const emptyObject: Endpoints = {};

  const endpointsProxy: Endpoints = new Proxy(emptyObject, {
    get,
    set: forbidManipulation,
  }) as Endpoints;

  return endpointsProxy;

  function get({}, endpointName: TelefunctionName) {
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

    if (typeof endpointName !== "string") {
      return undefined;
    }

    return function (this: Context, ...endpointArgs: TelefunctionArgs) {
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

      return callEndpoint(endpointName, endpointArgs, context, config);
    };
  }

  function forbidManipulation() {
    assertUsage(
      false,
      [
        "You cannot add/modify endpoint functions with the Telefunc client `telefunc/client`.",
        "Instead, define your endpoint functions with the Telefunc server `telefunc/server`.",
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
  endpointArgs: TelefunctionArgs,
  endpointName: TelefunctionName
): string | undefined {
  assert(endpointArgs.length >= 0);
  if (endpointArgs.length === 0) {
    return undefined;
  }
  let serializedArgs: string | undefined;
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

function getConfigProxy(configDefaults: ConfigPrivate): ConfigPrivate {
  const configObject: ConfigPrivate = { ...configDefaults };
  const configProxy: ConfigPrivate = new Proxy(configObject, {
    set: validateConfig,
  });
  return configProxy;

  function validateConfig(
    _: ConfigPrivate,
    configName: ConfigName,
    configValue: unknown
  ) {
    assertUsage(
      configName in configDefaults,
      [
        `Unknown config \`${configName}\`.`,
        "Make sure that the config is a `telefunc/client` config",
        "and not a `telefunc/server` one.",
      ].join(" ")
    );

    if (configName === "serverUrl") {
      const serverUrl = configValue as ServerURL;
      validateServerUrl(serverUrl);
    }

    configObject[configName] = configValue as never;
    return true;
  }
}
function validateServerUrl(serverUrl: ServerURL) {
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
    (function (this: unknown) {
      return notBinded(this);
    })() === true,
    "You seem to be using `telefunc/client` with an unknown environment/bundler; the following environemnts/bundlers are supported: webpack, Parcel, and Node.js. Open a new issue at https://github.com/telefunc/telefunc/issues/new for adding support for your environemnt/bundler."
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
      __INTERNAL_telefuncServer_nodejs: any;
    }
  }
}

function loadTimeStuff() {
  // We need ES6 `Proxy`
  assertProxySupport();

  verify({
    projectName: "Telefunc",
    npm: "telefunc",
    trustMode: true,
  });
}
