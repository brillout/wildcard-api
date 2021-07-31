import * as fastGlob from "fast-glob";
import { isAbsolute } from "path";
import { assert } from "../utils/assert";
import { findRootDir } from "../utils/findRootDir";
import { telefuncServer } from "../global-instance";

export { findAndLoadTelefuncFiles };

async function findAndLoadTelefuncFiles() {
  const rootDir = await findRootDir();
  if (!rootDir) return;

  let loadedFiles = [];
  for await (const telefuncFile of findTelefuncFiles(rootDir)) {
    loadedFiles.push(telefuncFile);
    require(telefuncFile.toString());
  }

  // If ts-node: directly load `.telefunc.ts` files
  if (loadedFiles.length > 0) return;
  // `ts-node` uses require.extensions:
  //   - https://github.com/TypeStrong/ts-node/issues/641
  if (!(".ts" in require.extensions)) return;

  for await (const telefuncFile of findTelefuncFiles(rootDir, "ts")) {
    const moduleExports = require(telefuncFile.toString());
    console.log('e2', moduleExports)
    Object.keys(moduleExports).forEach(telefunctionName => {
      telefuncServer.telefunctions[telefunctionName] = moduleExports[telefunctionName]
    })
  }
}

function findTelefuncFiles(
  rootDir: string,
  fileExtension = "js"
): NodeJS.ReadableStream {
  assert(isAbsolute(rootDir));

  const pattern = [
    `**/*.telefunc.${fileExtension}`,
    `**/telefunc.${fileExtension}`,
  ];

  const stream = fastGlob.stream(pattern, {
    // Skip hidden files.
    //  - `.git/`
    //  - `.yarn/` (Yarn V2)
    //  - `.cache/` (Parcel)
    //  - `.next/` (NextJS)
    //  - ...
    dot: false,
    ignore: ["**/node_modules", "**/.git"],
    cwd: rootDir,
    absolute: true,
  });

  return stream;
}
