"use strict";
// The purpose of this module is to allow Telefunc users to declare the type of `context`:
//
// ~~~ts
// import { context} from "telefunc/server";
//
// declare module "telefunc/server" {
//   export const context: Context;
// }
//
// type Context = {
//   isLoggedIn: boolean;
// };
//
// // TypeScript will not complain
// context.isLoggedIn;
// ~~~
//
// Re-declartions are forbidden: "Non-function members of the interfaces should be unique. If they are not unique, they must be of the same type. The compiler will issue an error if the interfaces both declare a non-function member of the same name, but of different types." -- source: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces
// So, the trick here is to make a detour over JavaScript to avoid TypeScript generating a declaration for `context`.
const { telefuncServer } = require("./global-instance");
module.exports.context = telefuncServer.context;
//# sourceMappingURL=contextUntyped.js.map