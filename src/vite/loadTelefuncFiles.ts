import { assert, assertUsage, isCallable, isObject } from "../server/utils";
import type { ViteDevServer } from "vite";

export { loadTelefuncFiles };

type TelefuncFiles = Record<string, Record<string, Function>>;

async function loadTelefuncFiles(telefuncContext: {
  _viteDevServer: ViteDevServer;
}): Promise<TelefuncFiles> {
  const viteDevServer = telefuncContext._viteDevServer;
  //
  let moduleExports: unknown;
  const modulePath = requireResolve(`./globImportTelefuncFiles.ts`);
  try {
    moduleExports = await viteDevServer.ssrLoadModule(modulePath);
  } catch (err) {
    viteDevServer.ssrFixStacktrace(err);
    throw err;
  }
  const telefuncFiles: unknown = (moduleExports as any).globImportTelefuncFiles().telefuncFiles;
  assertTelefuncFiles(telefuncFiles);
  return telefuncFiles;
}

function assertTelefuncFiles(
  telefuncFiles: unknown
): asserts telefuncFiles is TelefuncFiles {
  assert(isObject(telefuncFiles));
  Object.values(telefuncFiles).forEach((telefuncFileExports) => {
    assert(isObject(telefuncFileExports));
    Object.values(telefuncFileExports).forEach((telefunction) => {
      assertUsage(isCallable(telefunction), "TODO");
    });
  });
}

function require_(modulePath: string): unknown {
  // `req` instead of `require` so that Webpack doesn't do dynamic dependency analysis
  const req = require;
  return req(modulePath);
}
function requireResolve(modulePath: string): string {
  // `req` instead of `require` so that Webpack doesn't do dynamic dependency analysis
  const req = require;
  return req.resolve(modulePath);
}
