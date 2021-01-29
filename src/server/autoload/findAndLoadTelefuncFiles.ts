import * as fastGlob from "fast-glob";
import { isAbsolute } from "path";
import { assert } from "../utils/assert";
import { findRootDir } from "../utils/findRootDir";

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
    require(telefuncFile.toString());
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
    dot: false, // Skip hidden files. E.g. Yarn v2's `.yarn` or Parcel's `.cache`.
    ignore: ["**/node_modules", "**/.git"],
    cwd: rootDir,
    absolute: true,
  });

  return stream;
}
