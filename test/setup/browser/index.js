require("babel-polyfill");
const { server, config } = require("telefunc/client");
const { WildcardClient } = require("telefunc/client/WildcardClient");
const assert = require("assert");
Object.assign(window, { assert, server, config, WildcardClient });
Object.assign(window, {
  assert,
  assert_noErrorStack,
  server,
  config,
  WildcardClient,
});

// TODO: run this assertion on every browser-side stdout & stderr
// Stack traces should never be shown in the client
function assert_noErrorStack(text) {
  assert(!text.includes("Error"));
  assert(!/\bat\b/.test(text));
}
