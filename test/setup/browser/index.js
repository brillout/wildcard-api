require("babel-polyfill");
require("telefunc/client"); // Will expose interface over `window`
const { TelefuncClient } = require("telefunc/client/TelefuncClient");
const assert = require("assert");
Object.assign(window, {
  assert,
  assert_noErrorStack,
  __TelefuncClient: TelefuncClient,
});

// TODO: run this assertion on every browser-side stdout & stderr
// Stack traces should never be shown in the client
function assert_noErrorStack(text) {
  assert(!text.includes("Error"));
  assert(!/\bat\b/.test(text));
}
