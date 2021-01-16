import { telefuncClient } from "./global-instance";
export const server = telefuncClient.telefunctions;

export const { config } = telefuncClient;

import { TelefuncError } from "./makeHttpRequest";
export { TelefuncError };

/*
import { context } from "./sessions";
export { context };
*/

let context;
if (isNodejs()) {
  context = module.exports.context = eval("require")("telefunc/server").context;
} else {
  // Is Browser
  context = module.exports.context = require("./sessions").context;
}
function isNodejs(): boolean {
  return typeof window === "undefined" || !("cookie" in window?.document);
}

if (typeof window !== "undefined") {
  window.telefunc = {
    context,
    server,
    config,
    TelefuncError,
  } as never;
}
// TypeScript users should not use `window.telefunc`
declare global {
  interface Window {
    telefunc: never;
  }
}
