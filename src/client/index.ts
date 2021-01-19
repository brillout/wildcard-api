import { telefuncClient } from "./global-instance";
import { TelefuncError } from "./makeHttpRequest";

export const server = telefuncClient.telefunctions;
export const { config } = telefuncClient;
export { TelefuncError };

if (typeof window !== "undefined") {
  const { context } = require("telefunc/context");
  window.telefunc = {
    context,
    server,
    config,
    TelefuncError,
  } as never;
}

// TypeScript users should never use `window.telefunc`
declare global {
  interface Window {
    telefunc: never;
  }
}
