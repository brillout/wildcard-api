require("babel-polyfill");
const { server, config } = require("@wildcard-api/client");
const { WildcardClient } = require("@wildcard-api/client/WildcardClient");
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
