import { init, parse } from "es-module-lexer";
import { relative } from "path";
import { createUnplugin } from "unplugin";
import { assert, isObject } from "../server/utils";
import {
  getImportBuildCode,
} from "./getImportBuildCode";

export { unpluginTransform };

// @ts-ignore
const unpluginTransform = createUnplugin(() => {
  // better way to handle config.root in webpack/rollup?
  let root = process.cwd();
  return {
    name: "telefunc:transform",
    vite: {
      configResolved: (config) => {
        root = config.root || root;
      },
      config: () => {
        return {
          ssr: { external: ["telefunc"] },
        };
      },
      transform(src, id, options) {
        if (!isTelefunc(id)) {
          return;
        }
        if (isSSR(options)) {
          return;
        }
        return interTransform(src, id, root);
      },
    },
    transformInclude: (id) =>
      isTelefunc(id) || isImportBuildFile(id) || isImportTelefuncFilesFile(id),
    transform: (src, id) => {
      if (isImportTelefuncFilesFile(id)) {
        return {
          code: src.replace("@telefunc/REPLACE_PATH", root),
          map: null,
        };
      }
      if (isImportBuildFile(id)) {
        return {
          code: getImportBuildCode(),
          map: null,
        };
      }
      if (isSSR()) {
        return;
      }
      return interTransform(src, id, root);
    },
  };
});

// https://github.com/vitejs/vite/discussions/5109#discussioncomment-1450726
function isSSR(options?: undefined | boolean | { ssr: boolean }): boolean {
  // webpack specific
  if (process.argv.includes("--ssr")) {
    return true;
  }
  if (options === undefined) {
    return false;
  }
  if (typeof options === "boolean") {
    return options;
  }
  if (isObject(options)) {
    return !!options.ssr;
  }
  assert(false);
}

function isImportTelefuncFilesFile(id: string) {
  return id.includes("/importTelefuncFiles/");
}

function isImportBuildFile(id: string) {
  return id.includes("importBuild.js");
}

function isTelefunc(id: string) {
  return id.includes(".telefunc.");
}

async function interTransform(src: string, id: string, root: string) {
  assert(root);
  const filepath = "/" + relative(root, id);
  assert(!filepath.startsWith("/."));
  await init;
  const exports = parse(src)[1];
  return {
    code: getCode(exports, filepath),
    map: null,
  };
}

function getCode(exports: readonly string[], filePath: string) {
  let code = `import { server } from 'telefunc/client'

  `;
  exports.forEach((exportName) => {
    code += `export const ${exportName} = server['${filePath}:${exportName}'];\n`;
  });
  return code;
}
