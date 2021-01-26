type Context = {
  isLoggedIn: boolean;
};

import "telefunc/server";
declare module "telefunc/server" {
  export const context: Context;
}

import "telefunc/client";
declare module "telefunc/client" {
  export const context: Context;
}
