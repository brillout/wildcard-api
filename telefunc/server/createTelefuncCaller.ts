import { assertUsage, hasProp, isPlainObject } from "./utils";
import type { ViteDevServer } from "vite";
import { callTelefunc } from "./callTelefunc";

export { createTelefuncCaller };

export type Config = {
  viteDevServer?: ViteDevServer;
  root?: string;
  isProduction: boolean;
  /** Whether Telefunc generates HTTP ETag headers. */
  disableCache: boolean;
  /** Serve Telefunc HTTP requests at `/${baseUrl}/*`. Default: `_telefunc`. */
  baseUrl: string;
};

function createTelefuncCaller({
  viteDevServer,
  root,
  isProduction,
  baseUrl = "/_telefunc",
  disableCache = false,
}: Config) {
  const config = { viteDevServer, root, isProduction, baseUrl, disableCache };
  assertArgs(config, ...arguments);

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
    return callTelefunc(Array.from(arguments), config);
  };
}

function assertArgs(config: unknown, ...args: unknown[]) {
  assertUsage(
    args.length === 1,
    "`createTelefuncCaller()`: all arguments should be passed as a single argument object."
  );
  assertUsage(
    isPlainObject(config),
    '`createTelefuncCaller(argumentObject)`: all arguments should be passed as a single argument object, i.e. `typeof argumentObject === "object"`.'
  );
  assertUsage(
    hasProp(config, "isProduction", "boolean"),
    "`createTelefuncCaller({ isProduction })`: argument `isProduction` should be a boolean."
  );
  assertUsage(
    hasProp(config, "disableCache", "boolean"),
    "`createTelefuncCaller({ disableCache })`: argument `disableCache` should be a boolean."
  );
  assertUsage(
    hasProp(config, "baseUrl", "string"),
    "`createTelefuncCaller({ baseUrl })`: argument `baseUrl` should be a string."
  );
  const _baseUrl = config.baseUrl;
  const _disableCache = config.disableCache;
  const _isProduction = config.isProduction;
  let _viteDevServer: undefined | ViteDevServer = undefined;
  let _root: undefined | string;
  if (_isProduction) {
    _viteDevServer = undefined;
    _root = undefined;
    if ("root" in config && config.root !== undefined) {
      assertUsage(
        hasProp(config, "root", "string"),
        "`createTelefuncCaller({ root })`: argument `root` should be a string."
      );
      _root = config.root;
    }
    return { _viteDevServer, _root, _isProduction, _baseUrl, _disableCache };
  } else {
    assertUsage(
      hasProp(config, "viteDevServer"),
      "`createTelefuncCaller({ viteDevServer })`: argument `viteDevServer` is missing."
    );
    assertUsage(
      hasProp(config, "root", "string"),
      "`createTelefuncCaller({ root })`: argument `root` should be a string."
    );
    _viteDevServer = config.viteDevServer as ViteDevServer;
    _root = config.root;
    return { _viteDevServer, _root, _isProduction, _baseUrl, _disableCache };
  }
}
