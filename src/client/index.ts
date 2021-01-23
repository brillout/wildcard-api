import { telefuncClient } from "./global-instance";
import { TelefuncError } from "./makeHttpRequest";

export { TelefuncError };
export const server = telefuncClient.telefunctions;
export const { config } = telefuncClient;
//@ts-ignore
import { context } from "telefunc/context/contextUntyped";
export { context };

if (typeof window !== "undefined") {
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
