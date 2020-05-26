require("babel-polyfill");
const wildcardClient = require("../../../client");
const { endpoints } = wildcardClient;
const WildcardClient = require("../../../client/WildcardClient");
const assert = require("@brillout/assert");
Object.assign(window, { assert, endpoints, wildcardClient, WildcardClient });
