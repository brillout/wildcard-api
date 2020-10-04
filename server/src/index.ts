import { WildcardApi } from "./WildcardApi";

export { WildcardApi };
export const wildcardApi = (global.__globalWildcardApi = new WildcardApi());

// TODO: remove default export
export default wildcardApi;

declare global {
  namespace NodeJS {
    interface Global {
      __globalWildcardApi: any;
    }
  }
}
