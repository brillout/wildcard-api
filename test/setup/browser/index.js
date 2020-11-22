require("babel-polyfill");
const { server, config } = require("telefunc/client");
const { TelefuncClient } = require("telefunc/client/TelefuncClient");
const assert = require("assert");
Object.assign(window, { assert, server, config, TelefuncClient });
Object.assign(window, {
  assert,
  assert_noErrorStack,
  server,
  config,
  TelefuncClient,
});

// TODO: run this assertion on every browser-side stdout & stderr
// Stack traces should never be shown in the client
function assert_noErrorStack(text) {
  assert(!text.includes("Error"));
  assert(!/\bat\b/.test(text));
}
