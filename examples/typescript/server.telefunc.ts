import { server } from "telefunc/server";
import * as postTelefunctions from "./posts/posts.telefunc";
import * as userTelefunctions from "./users/users.telefunc";

const telefunctions = { ...postTelefunctions, ...userTelefunctions };

Object.assign(server, telefunctions);

declare module "telefunc/client" {
  export const server: typeof telefunctions;
}
