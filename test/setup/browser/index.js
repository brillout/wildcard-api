require("babel-polyfill");
const telefunc = require("telefunc/client");
const { server, config, context } = telefunc;
const { TelefuncClient } = require("telefunc/client/TelefuncClient");
const assert = require("assert");
Object.assign(window, {
  assert,
  assert_noErrorStack,
  server,
  config,
  telefunc_context: context,
  TelefuncClient,
});

// TODO: run this assertion on every browser-side stdout & stderr
// Stack traces should never be shown in the client
function assert_noErrorStack(text) {
  assert(!text.includes("Error"));
  assert(!/\bat\b/.test(text));
}
