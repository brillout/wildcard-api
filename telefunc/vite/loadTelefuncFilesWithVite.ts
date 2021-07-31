import { assert, hasProp, isObject, moduleExists } from "../server/utils";
import type { ViteDevServer } from "vite";
import { loadViteEntry } from './loadViteEntry'

export { loadTelefuncFilesWithVite };

type TelefuncFiles = Record<string, Record<string, unknown>>;

async function loadTelefuncFilesWithVite(telefuncContext: {
  _root: string;
  _viteDevServer?: ViteDevServer;
  _isProduction: boolean;
}): Promise<TelefuncFiles> {
  const viteEntryFile = 'globImportTelefuncFiles'
  assert(moduleExists(`./${viteEntryFile}.js`, __dirname))
  const userDist = `${telefuncContext._root}/dist`
  const prodPath = `${userDist}/server/${viteEntryFile}.js`
  // const pluginDist = `../../../dist`
  // const devPath = `${pluginDist}/esm/page-files/${viteEntryFile}.ts`
  const devPath = `./${viteEntryFile}.ts`

  const errorMessage =
    'Make sure to run `vite build && vite build --ssr` before running your Node.js server with `createTelefuncCaller({ isProduction: true})`.'

  const moduleExports = await loadViteEntry({
    devPath,
    prodPath,
    errorMessage,
    viteDevServer: telefuncContext._viteDevServer,
    isProduction: telefuncContext._isProduction
  })

  assert(hasProp(moduleExports, 'globImportTelefuncFiles', 'function'))
  const globResult = moduleExports.globImportTelefuncFiles()
  assert(hasProp(globResult, 'telefuncFiles', 'object'))
  const telefuncFiles = globResult.telefuncFiles;
  assert(isObjectOfObjects(telefuncFiles))
  return telefuncFiles;
}

function isObjectOfObjects(obj: unknown): obj is Record<string, Record<string, unknown>> {
   return isObject(obj) && Object.values(obj).every(isObject)
}
