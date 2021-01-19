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
// Re-declartions are forbidden: "Non-function members of the interfaces should be unique. If they are not unique, they must be of the same type. The compiler issues an error if the interfaces both declare a non-function member of the same name, but of different types." -- source: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces
//
// The trick here is to make a detour over JavaScript to avoid TypeScript generating a declaration for `context`.
//
// We do type `telefunc/context/index.ts` so that the TypeScript compiler doesn't issue the error `Could not find a declaration file for module 'telefunc/context'`.

let context;
if (isBrowser()) {
  context = require("telefunc/context/browser").context;
} else {
  context = eval("require")("telefunc/context/server").context;
}

module.exports.context = context;

function isBrowser() {
  return (
    typeof window !== "undefined" &&
    window.document &&
    "cookie" in window.document
  );
}
