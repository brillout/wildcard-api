import { WildcardServer } from "./WildcardServer";

export { WildcardServer };
export const wildcardServer = (global.__INTERNAL_wildcardServer_nodejs = new WildcardServer());
export const server = wildcardServer.endpoints;
export const { config } = wildcardServer;
export const { getApiHttpResponse } = wildcardServer;

declare global {
  namespace NodeJS {
    interface Global {
      __INTERNAL_wildcardServer_nodejs: any;
    }
  }
}
