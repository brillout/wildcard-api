import { telefuncClient } from "./global-instance";
export const server = telefuncClient.telefunctions;

export const { config } = telefuncClient;

import { TelefuncError } from "./makeHttpRequest";
export { TelefuncError };

/*
import { context } from "./sessions";
export { context };
*/

if (typeof window !== "undefined") {
  const { context } = require("telefunc/context");
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
