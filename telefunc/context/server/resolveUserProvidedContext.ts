import { assert } from "../../server/utils/assert";
import { ContextGetter, ContextObject } from "../../server/TelefuncServer";
import { isCallable } from "../../server/utils/isCallable";
import { assertContextObject } from "./assertContextObject";

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
