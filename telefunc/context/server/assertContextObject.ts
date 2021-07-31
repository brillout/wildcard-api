import { assertUsage } from "telefunc/server/utils/assert";

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
      "a `context.constructor===" + context.constructor.name + "`;",
      "it should be a `context.constructor===Object` instead.",
    ].join(" ")
  );
}
