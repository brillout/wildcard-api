import { assert, assertUsage } from "telefunc/server/utils/assert";
import { ContextGetter, ContextObject } from "telefunc/server/TelefuncServer";
import { isCallable } from "telefunc/server/utils/isCallable";

export { resolveUserProvidedContext };

async function resolveUserProvidedContext(
  context: ContextGetter | ContextObject | undefined
): Promise<ContextObject> {
  if (context === undefined) {
    return {};
  }

  if (isCallable(context)) {
    const contextFunctionName = getFunctionName(context);
    context = await context();
    assertContextGetterResult(context, contextFunctionName);
  } else {
    assertUsage(
      context && context instanceof Object,
      [
        "The context cannot be `" + context + "`.",
        "The context should be a `instanceof Object`.",
        "If there is no context then use the empty object `{}`.",
      ].join(" ")
    );
  }
  assert(context && context instanceof Object);

  return context as ContextObject;
}

function assertContextGetterResult(
  context: unknown,
  contextFunctionName: string | null
) {
  const errorMessageBegin = [
    "Your context function",
    ...(!contextFunctionName ? [] : ["`" + contextFunctionName + "`"]),
    "should",
  ].join(" ");
  assertUsage(
    context !== undefined && context !== null,
    [
      errorMessageBegin,
      "not return `" + context + "`.",
      "If there is no context, then return the empty object `{}`.",
    ].join(" ")
  );
  assertUsage(
    context instanceof Object,
    [errorMessageBegin, "return a `instanceof Object`."].join(" ")
  );
}

function getFunctionName(fn: Function): string {
  let { name } = fn;
  assert(typeof name === "string");
  const PREFIX = "bound ";
  if (name.startsWith(PREFIX)) {
    return name.slice(PREFIX.length);
  }
  return name;
}
