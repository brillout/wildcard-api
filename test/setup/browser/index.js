require("babel-polyfill");
const { server, config, WildcardClient } = require("@wildcard-api/client");
const assert = require("assert");
Object.assign(window, { assert, server, config, WildcardClient });
