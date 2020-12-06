import { telefuncClient } from "./global-instance";
export const server = telefuncClient.endpoints;
export const { config } = telefuncClient;
import { context } from "./sessions";
export { context };

if (typeof window !== "undefined") {
  window.telefunc = {
    context,
    server,
    config,
  } as never;
}
// TypeScript users should not use `window.telefunc`
declare global {
  interface Window {
    telefunc: never;
  }
}
