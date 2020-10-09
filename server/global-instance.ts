import { WildcardServer } from "./WildcardServer";

export const wildcardServer = (global.__INTERNAL_wildcardServer_nodejs = new WildcardServer());

declare global {
  namespace NodeJS {
    interface Global {
      __INTERNAL_wildcardServer_nodejs: any;
    }
  }
}
