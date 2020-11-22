import { TelefuncServer } from "./TelefuncServer";

export const wildcardServer = (global.__INTERNAL_wildcardServer_nodejs = new TelefuncServer());

declare global {
  namespace NodeJS {
    interface Global {
      __INTERNAL_wildcardServer_nodejs: any;
    }
  }
}
