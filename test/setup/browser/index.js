require("babel-polyfill");
const wildcardClient = require("@wildcard-api/client");
const { endpoints } = wildcardClient;
const WildcardClient = require("@wildcard-api/client/WildcardClient");
const assert = require("@brillout/assert");
Object.assign(window, { assert, endpoints, wildcardClient, WildcardClient });
