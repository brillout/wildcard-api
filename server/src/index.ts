import { WildcardServer } from "./WildcardApi";

export { WildcardServer };
export const wildcardServer = (global.__globalWildcardApi = new WildcardServer());
export const server = wildcardServer.endpoints;
export const { config } = wildcardServer;
export const { getApiHttpResponse } = wildcardServer;

declare global {
  namespace NodeJS {
    interface Global {
      __globalWildcardApi: any;
    }
  }
}
