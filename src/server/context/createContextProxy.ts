import { assert, assertUsage, assertWarning } from "../utils/assert";
import { TelefuncServer } from "../TelefuncServer";
import { ContextHook, getContextHook } from "./async-hook-management";
import { getContextFromCookie, __secretKey } from "./cookie-management";

export { createContextProxy };

function createContextProxy(telefuncServer: TelefuncServer) {
  return new Proxy({}, { get, set });
  function get(emptyObjec: never, prop: string) {
    // Enable native methods such as `constructor`
    if (prop in emptyObjec) return emptyObjec[prop];

    const contextHook = getContextHook();
    assertUsage(
      contextHook,
      [
        `You are trying to access the context \`context.${prop}\``,
        "outside the lifetime of an HTTP request.",
        "Context is only available wihtin the lifetime of an HTTP request;",
        `make sure to read \`context.${prop}\``,
        "*after* Node.js received the HTTP request and",
        "*before* the HTTP response has been sent.",
      ].join(" ")
    );

    const {
      contextModificationValue,
      contextModificationValueExists,
    } = getContextModificationValue(contextHook, prop);

    const { userDefinedValue, userDefinedValueExists } = getUserDefinedValue(
      contextHook,
      prop
    );

    const {
      telefuncCookieValue,
      telefuncCookieValueExists,
    } = getTelefuncCookieValue(contextHook, prop);

    assertWarning(
      !(userDefinedValueExists && telefuncCookieValueExists),
      [
        `The context \`context.${prop}\` is defined twice:`,
        `you defined the value of \`context.${prop}\` but a`,
        `Telfunc cookie does as well define \`context.${prop}\`.`,
      ].join(" ")
    );
    assert(!(userDefinedValueExists && contextModificationValueExists));

    if (contextModificationValueExists) {
      return contextModificationValue;
    }
    if (userDefinedValueExists) {
      return userDefinedValue;
    }
    if (telefuncCookieValueExists) {
      return telefuncCookieValue;
    }
    return undefined;
  }
  function set(_: never, prop: string, newVal: unknown): boolean {
    /*
    assertUsage(
      !isDirectCall,
      "The context object can only be modified when running the Telefunc client in the browser, but you are using the Telefunc client on the server-side in Node.js."
    );
    */
    const contextHook = getContextHook();
    assertUsage(
      contextHook,
      [
        `You are trying to change the context \`context.${prop}\``,
        // "outside of a telefunction,",
        // "but context can be changed only within a telefunction call.",
        "outside the lifetime of an HTTP request.",
        "Context is only available wihtin the lifetime of an HTTP request;",
        `make sure to change \`context.${prop}\``,
        "*after* Node.js received the HTTP request and",
        "*before* the HTTP response has been sent.",
      ].join(" ")
    );

    assertUsage(
      telefuncServer[__secretKey],
      [
        `You are trying to change the context \`context.${prop}\`,`,
        "but context can be modified only after `setSecretKey()` has been called.",
        "Make sure you call `setSecretKey()` before modifying the context.",
      ].join(" ")
    );

    const { userDefinedValueExists } = getUserDefinedValue(contextHook, prop);
    assertUsage(
      !userDefinedValueExists,
      [
        `You are trying to change the context \`context.${prop}\``,
        `but you define the value \`context.${prop}\` yourself.`,
      ].join(" ")
    );

    contextHook.contextModifications_[prop] = newVal;

    return true;
  }

  function getContextModificationValue(contextHook: ContextHook, prop: string) {
    assert(contextHook);
    if (!(prop in contextHook.contextModifications_)) {
      return { contextModificationValueExists: false };
    }
    const contextModificationValue = contextHook.contextModifications_[prop];
    return { contextModificationValue, contextModificationValueExists: true };
  }
  function getUserDefinedValue(contextHook: ContextHook, prop: string) {
    assert(contextHook);
    if (!(prop in contextHook.userDefinedContext)) {
      return { userDefinedValueExists: false };
    }
    const userDefinedValue = contextHook.userDefinedContext[prop];
    return { userDefinedValue, userDefinedValueExists: true };
  }

  function getTelefuncCookieValue(contextHook: ContextHook, prop: string) {
    assert(contextHook);
    const headers = contextHook.getRequestHeaders();
    const result = getContextFromCookie(
      prop,
      headers?.cookie,
      telefuncServer[__secretKey]
    );
    assertUsage(
      !("secretKeyMissing" in result),
      [
        `You are trying to access the \`context.${prop}\``,
        "which does exist in a Telefunc Cookie,",
        "but `setSecretKey()` has not been called yet.",
        "Make sure to call `setSecretKey()` *before*",
        `you try to access \`context.${prop}\`.`,
      ].join(" ")
    );

    if ("contextValue" in result) {
      const telefuncCookieValue = result.contextValue;
      return { telefuncCookieValueExists: true, telefuncCookieValue };
    } else {
      return { telefuncCookieValueExists: false };
    }
  }
}
