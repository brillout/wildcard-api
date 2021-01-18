type Context = {
  isLoggedIn: boolean;
};

declare module "telefunc/context" {
  export const context: Context;
}
