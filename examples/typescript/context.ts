export type Context = {
  isLoggedIn: boolean;
};

declare module "telefunc/server" {
  export const context: Context;
}
