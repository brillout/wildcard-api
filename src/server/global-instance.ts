import { TelefuncServer } from "./TelefuncServer";

export const telefuncServer = (global.__INTERNAL_telefuncServer_nodejs = new TelefuncServer());

declare global {
  namespace NodeJS {
    interface Global {
      __INTERNAL_telefuncServer_nodejs: any;
    }
  }
}
