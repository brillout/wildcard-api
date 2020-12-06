import { telefuncClient } from "./global-instance";
export const server = telefuncClient.endpoints;
export const { config } = telefuncClient;
import { context } from "./sessions";
export { context };

window.telefunc = {
  context,
  server,
  config,
} as never;
declare global {
  interface Window {
    telefunc: never;
  }
}
