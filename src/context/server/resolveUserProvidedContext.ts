import { assert, assertUsage } from "telefunc/server/utils/assert";
import { ContextGetter, ContextObject } from "telefunc/server/TelefuncServer";
import { isCallable } from "telefunc/server/utils/isCallable";

export { resolveUserProvidedContext };
export { assertContextObject };

function assertContextObject(context: any, contextSource: string) {
  assertUsage(
    context && typeof context === "object",
    [
      "The `context`",
      contextSource,
      "is not allowed to be",
      "`" + context + "`;",
      "it should be a `context.constructor===Object` instead;",
      "if there is no context then use the empty object `{}`.",
    ].join(" ")
  );
  assertUsage(
    context.constructor === Object,
    [
      "The `context`",
      contextSource,
      "is not allowed to be",
      "a `context.constructor===" + context.constructor + "`;",
      "it should be a `context.constructor===Object` instead;",
    ].join(" ")
  );
}

async function resolveUserProvidedContext(
  context: ContextGetter | ContextObject | undefined
): Promise<ContextObject> {
  if (context === undefined) {
    return {};
  }

  if (isCallable(context)) {
    const contextFunctionName = getFunctionName(context);
    context = await context();
    assertContextObject(
      context,
      "returned by your context function" +
        (contextFunctionName ? " `" + contextFunctionName + "`" : "")
    );
  } else {
    assertContextObject(
      context,
      "provided by `getApiHttpResponse(requestProps, context)`"
    );
  }
  assert(context.constructor === Object);

  return context as ContextObject;
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
