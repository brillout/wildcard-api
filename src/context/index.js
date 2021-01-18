// We purposely don't use TypeScript for this module in order to allow Telefunc users to declare the type of `context`:
//
//    // context.d.ts
//    type Context = {
//      isLoggedIn: boolean;
//    };
//    declare module "telefunc/context" {
//      export const context: Context;
//    }
//
//
// Re-declartions are forbidden: "Non-function members of the interfaces should be unique. If they are not unique, they must be of the same type. The compiler will issue an error if the interfaces both declare a non-function member of the same name, but of different types." -- source: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces
//
// So, the trick here is to make a detour over JavaScript to avoid TypeScript generating a declaration for `context`.

let context;
if (isBrowser()) {
  context = require("telefunc/client/sessions").context;
} else {
  context = eval("require")("telefunc/server/context").context;
}

module.exports.context = context;

function isBrowser() {
  return (
    typeof window !== "undefined" &&
    window.document &&
    "cookie" in window.document
  );
}
