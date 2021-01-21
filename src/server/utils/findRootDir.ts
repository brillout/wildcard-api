import {
  isAbsolute as pathIsAbsolute,
  dirname as pathDirname,
  sep as pathSep,
} from "path";
import { findUp } from "./findUp";
import { assert } from "./assert";
import getCallsites = require("callsites");

export { findRootDir };

// We get the callstack now to make sure we don't get the callstack of an event loop
const callstack = getCallstack();

/**
 * Find the user's project root directory
 */
async function findRootDir() {
  const firstUserFile = getFirstUserFile();
  assert(firstUserFile && pathIsAbsolute(firstUserFile));

  const packageJsonFile = await findUp(
    "package.json",
    pathDirname(firstUserFile)
  );

  if (!packageJsonFile) {
    return null;
  }

  const userRootDir = pathDirname(packageJsonFile);
  return userRootDir;
}

function getFirstUserFile() {
  const userScripts = getUserFiles();
  const userScript = userScripts.slice(-1)[0] || null;
  return userScript;
}
function getUserFiles() {
  const userScripts = [];
  for (let i = 0; i < callstack.length; i++) {
    const filePath = callstack[i];
    if (isDependency(filePath)) {
      // We can cut off the whole stack at the first `node_modules/*` file
      break;
    }
    userScripts.push(filePath);
  }
  return userScripts;
}
function isDependency(filePath: string) {
  // If a `filePath` contains `node_modules` then it's a dependency
  const inNodeModuleDir = filePath.split(pathSep).includes("node_modules");
  if (inNodeModuleDir) {
    return true;
  }

  /*
  // Catch the case when using `npm link` for `@brillout/project-files`
  const isLinked = filePath.startsWith(__dirname);
  if (isLinked) {
    return true;
  }
  */

  return false;
}

function getCallstack() {
  const callsites = getAllCallsites();

  const callstack = [];
  for (let i = callsites.length - 1; i >= 0; i--) {
    const callsite = callsites[i];
    if (callsite.isNative()) {
      continue;
    }
    const filePath = callsite.getFileName();
    if (!filePath) {
      continue;
    }
    if (isNodejsSourceFile(filePath)) {
      continue;
    }
    callstack.push(filePath);
  }

  return callstack;
}
function isNodejsSourceFile(filePath: string) {
  return !pathIsAbsolute(filePath);
}
function getAllCallsites() {
  const stackTraceLimit__original = Error.stackTraceLimit;
  Error.stackTraceLimit = Infinity;
  const callsites = getCallsites();
  Error.stackTraceLimit = stackTraceLimit__original;
  return callsites;
}
