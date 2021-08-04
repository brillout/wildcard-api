import { assert, assertUsage, hasProp, isPlainObject } from "./utils";
import type { ViteDevServer } from "vite";
import { callTelefunc } from "./callTelefunc";
import { TelefuncContextEnv } from "./types";

export { createTelefuncCaller };

function createTelefuncCaller({
  viteDevServer,
  root,
  isProduction,
}: {
  viteDevServer?: ViteDevServer;
  root?: string;
  isProduction?: boolean;
}) {
  const telefuncEnv: TelefuncContextEnv = parseArgs(...arguments);
  assert("_viteDevServer" in telefuncEnv);
  assert("_root" in telefuncEnv);
  assert("_isProduction" in telefuncEnv);

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
    try {
      return await callTelefunc(Array.from(arguments), telefuncEnv);
    } catch (err) {
      console.error(err);
      return null;
    }
  };
}

function parseArgs(...args: unknown[]): TelefuncContextEnv {
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
    return { _viteDevServer, _root, _isProduction };
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
    return { _viteDevServer, _root, _isProduction };
  }
}
