import { WildcardApi } from "./WildcardApi";

export { WildcardApi };
export const wildcardApi = (global.__globalWildcardApi = new WildcardApi());
export const { endpoints } = wildcardApi;

declare global {
  namespace NodeJS {
    interface Global {
      __globalWildcardApi: any;
    }
  }
}
