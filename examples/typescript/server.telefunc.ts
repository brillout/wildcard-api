import { server } from "telefunc/server";
import * as telefunctions from "./main.telefunc";

Object.assign(server, telefunctions);
declare module "telefunc/client" {
  export const server: typeof telefunctions;
}
