import { assert, assertUsage, hasProp, isPlainObject } from "./utils";
import type { ViteDevServer } from "vite";
import { callTelefunc } from "./callTelefunc";
import { TelefuncContextConfig } from "./types";

export { createTelefuncCaller };

function createTelefuncCaller({
  viteDevServer,
  root,
  isProduction,
  baseUrl = "/_telefunc",
  disableCache = false,
}: {
  viteDevServer?: ViteDevServer;
  root?: string;
  isProduction?: boolean;
  /** Whether Telefunc generates HTTP ETag headers. */
  disableCache: boolean;
  /** Serve Telefunc HTTP requests at `/${baseUrl}/*`. Default: `_telefunc`. */
  baseUrl: string;
}) {
  const telefuncEnv: TelefuncContextConfig = parseArgs(...arguments);
  assert(telefuncEnv._isProduction === isProduction);
  assert(telefuncEnv._root === root);
  assert(telefuncEnv._viteDevServer === viteDevServer);
  assert(telefuncEnv._baseUrl === baseUrl);
  assert(telefuncEnv._disableCache === disableCache);

  /**
   * Get the HTTP response of a telefunction call.
   * @param requestProps.url HTTP request URL
   * @param requestProps.method HTTP request method
   * @param requestProps.body HTTP request body
   * @param context The context object
   * @returns HTTP response
   */
  return async function ({
    requestProps,
    telefuncContext,
  }: {
    requestProps: {
      url: string;
      method: string;
      body: string | unknown;
    };
    telefuncContext: Record<string, unknown>;
  }) {
    return callTelefunc(Array.from(arguments), telefuncEnv);
  };
}

function parseArgs(...args: unknown[]): TelefuncContextConfig {
  const [argObj, ...argsRest2] = args;
  assertUsage(
    argsRest2.length === 0,
    "`createTelefuncCaller()`: all arguments should be passed as a single argument object."
  );
  assertUsage(
    isPlainObject(argObj),
    '`createTelefuncCaller(argumentObject)`: all arguments should be passed as a single argument object, i.e. `typeof argumentObject === "object"`.'
  );
  assertUsage(
    hasProp(argObj, "isProduction", "boolean"),
    "`createTelefuncCaller({ isProduction })`: argument `isProduction` should be a boolean."
  );
  assertUsage(
    hasProp(argObj, "disableCache", "boolean"),
    "`createTelefuncCaller({ disableCache })`: argument `disableCache` should be a boolean."
  );
  assertUsage(
    hasProp(argObj, "baseUrl", "string"),
    "`createTelefuncCaller({ baseUrl })`: argument `baseUrl` should be a string."
  );
  const _baseUrl = argObj.baseUrl;
  const _disableCache = argObj.disableCache;
  const _isProduction = argObj.isProduction;
  let _viteDevServer: undefined | ViteDevServer = undefined;
  let _root: undefined | string;
  if (_isProduction) {
    _viteDevServer = undefined;
    _root = undefined;
    if ("root" in argObj && argObj.root !== undefined) {
      assertUsage(
        hasProp(argObj, "root", "string"),
        "`createTelefuncCaller({ root })`: argument `root` should be a string."
      );
      _root = argObj.root;
    }
    return { _viteDevServer, _root, _isProduction, _baseUrl, _disableCache };
  } else {
    assertUsage(
      hasProp(argObj, "viteDevServer"),
      "`createTelefuncCaller({ viteDevServer })`: argument `viteDevServer` is missing."
    );
    assertUsage(
      hasProp(argObj, "root", "string"),
      "`createTelefuncCaller({ root })`: argument `root` should be a string."
    );
    _viteDevServer = argObj.viteDevServer as ViteDevServer;
    _root = argObj.root;
    return { _viteDevServer, _root, _isProduction, _baseUrl, _disableCache };
  }
}
