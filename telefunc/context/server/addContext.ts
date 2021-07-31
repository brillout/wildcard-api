import { assert, assertUsage } from "telefunc/server/utils/assert";
import { ContextObject } from "telefunc/server/TelefuncServer";
import { getContextHook } from "./async-hook-management";
import { assertContextObject } from "./assertContextObject";

export { addContext };

function addContext(context: ContextObject): void {
  const contextHook = getContextHook();
  assertUsage(
    contextHook,
    [
      "You are trying to use `addContext()`",
      "outside the lifetime of an HTTP request.",
      "Context is only available wihtin the lifetime of an HTTP request;",
      "make sure to call `addContext()`",
      "*after* Node.js received the HTTP request and",
      "*before* the HTTP response has been sent.",
    ].join(" ")
  );
  assertContextObject(context, "provided by `addContext(context)`");
  assert(context.constructor === Object);
  contextHook.userDefinedContext = {
    ...contextHook.userDefinedContext,
    ...context,
  };
}
