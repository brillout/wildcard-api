require("babel-polyfill");
require("telefunc/client"); // Will expose interface over `window`
const cookieLibrary = require("cookie");
const { TelefuncClient } = require("telefunc/client/TelefuncClient");
const assert = require("assert");
Object.assign(window, {
  assert,
  assert_noErrorStack,
  cookieLibrary,
  deleteAllCookies,
  __TelefuncClient: TelefuncClient,
});

function deleteAllCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.trim().split("=")[0];
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  });
}

// TODO: run this assertion on every browser-side stdout & stderr
// Stack traces should never be shown in the client
function assert_noErrorStack(text) {
  assert(!text.includes("Error"));
  assert(!/\bat\b/.test(text));
}
