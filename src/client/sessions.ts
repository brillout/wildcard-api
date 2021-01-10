import { assertUsage, assert } from "./assert";
// @ts-ignore
import { parse } from "@brillout/json-s";

export const context = createContextProxy();

const cookieNamePrefix = "telefunc_";

function createContextProxy() {
  const contextObj = {};
  const contextProxy = new Proxy(contextObj, { set, get, deleteProperty });
  return contextProxy;
}

function set() {
  assertUsage(
    false,
    "On the client-side, it is forbidden to add or modify context. You can however delete context with `delete context['contextPropertyToDelete']`."
  );
  // make TS happy
  return false;
}

function get(_: object, prop: string) {
  assertBrowser();
  const cookieName = cookieNamePrefix + prop;
  const cookieVal = getCookie(cookieName);
  if (cookieVal === null) return undefined;
  let valParsed = cookieVal;
  valParsed = window.decodeURIComponent(valParsed);
  try {
    valParsed = parse(valParsed);
  } catch (err) {
    assertUsage(
      false,
      `Couldn't JSON parse session cookie \`${cookieName}\` with value: \`${valParsed}\``
    );
  }
  return valParsed;
}

function deleteProperty(_: object, prop: string) {
  assertBrowser();
  const cookieName = cookieNamePrefix + prop;
  const deleted = getCookie(cookieName) !== null;
  deleteCookie(cookieNamePrefix + prop);
  return deleted;
}

// Source: https://stackoverflow.com/questions/10593013/delete-cookie-by-name/23995984#23995984
function deleteCookie(name: string): void {
  document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

// Source: https://stackoverflow.com/questions/10730362/get-cookie-by-name/15724300#15724300
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  // @ts-ignore
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function assertBrowser() {
  assert(!isNodejs());
  /*
  assertUsage(
    !isNodejs(),
    'The context object `import { context } from "telefunc/client"` is available only in the browser. You seem to try to use it in Node.js. Consider using `import { context } from "telefunc/server"` instead.'
  );
  */
}

function isNodejs(): boolean {
  return typeof window === "undefined" || !("cookie" in window?.document);
}
