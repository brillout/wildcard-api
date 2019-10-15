require('babel-polyfill');
const wildcardClient = require('../../../client');
const {endpoints} = wildcardClient;
const WildcardClient = require('../../../client/WildcardClient');
const assert = require('@brillout/reassert');
Object.assign(window, {assert, endpoints, wildcardClient, WildcardClient});
