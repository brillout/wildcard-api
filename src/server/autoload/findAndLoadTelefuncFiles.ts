import fastGlob = require("fast-glob");
import { isAbsolute } from "path";
import { assert } from "../utils/assert";
import { findRootDir } from "../utils/findRootDir";

export { findAndLoadTelefuncFiles };

async function findAndLoadTelefuncFiles() {
  const stream = await findTelefuncFiles();
  if (!stream) return;
  for await (const entry of stream) {
    require(entry.toString());
  }
}

async function findTelefuncFiles(): Promise<NodeJS.ReadableStream | null> {
  const rootDir = await findRootDir();
  if (!rootDir) return null;
  assert(isAbsolute(rootDir));

  const stream = fastGlob.stream(["**/*.telefunc.js"], {
    dot: false, // Skip hidden files. E.g. Yarn v2's `.yarn` or Parcel's `.cache`.
    ignore: ["**/node_modules"],
    cwd: rootDir,
    absolute: true,
  });

  return stream;
}
