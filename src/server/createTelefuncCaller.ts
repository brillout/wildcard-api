import { assert, assertUsage, hasProp, isPlainObject } from "./utils";
import { telefuncServer } from "./global-instance";
import type { HttpRequestProps, HttpResponseProps } from "./TelefuncServer";
import type { ViteDevServer } from "vite";
import { loadTelefuncFiles } from "../vite/loadTelefuncFiles";
import type { Telefunction } from "../server/TelefuncServer";

type TelefuncEnv =
  | {
      _isProduction: false;
      _viteDevServer: ViteDevServer;
      _root: string;
    }
  | {
      _isProduction: true;
      _viteDevServer: undefined;
      _root?: string;
    };

type TelefuncContext = HttpRequestProps &
  TelefuncEnv & {} & Record<string, unknown>;

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
  const telefuncEnv: TelefuncEnv = validateArgs(...arguments);

  return callTelefunc;

  async function callTelefunc(
    telefuncContext: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
    } & Record<string, unknown>
  ): Promise<null | { body: string; statusCode: number }> {
    addTelefuncEnv(telefuncContext, telefuncEnv);
    assert(telefuncContext._viteDevServer); // TODO
    const methods: ("GET" | "POST")[] = ["GET", "POST"];
    assertUsage(hasProp(telefuncContext, "method", methods), "TODO");

    const telefuncFiles = await loadTelefuncFiles(telefuncContext);
    Object.values(telefuncFiles).forEach((telefuncFileExports) => {
      Object.keys(telefuncFileExports).forEach((telefunctionName) => {
    console.log("e4", telefunctionName);
        telefuncServer.telefunctions[telefunctionName] = telefuncFileExports[
          telefunctionName
        ] as Telefunction;
      });
    });

    const httpResponse: null | HttpResponseProps =
      await telefuncServer.getApiHttpResponse(telefuncContext, telefuncContext);
    return httpResponse;
  }
}

function addTelefuncEnv<Ctx extends Record<string, unknown>>(
  telefuncContext: Ctx,
  telefunctEnv: TelefuncEnv
): asserts telefuncContext is Ctx & TelefuncEnv {
  Object.assign(telefuncContext, telefunctEnv);
}

function validateArgs(...args: unknown[]): TelefuncEnv {
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
