require('babel-polyfill');
const wildcardApiClient = require('../../../client');
const {endpoints} = require('../../../client');
const assert = require('@brillout/reassert');
Object.assign(window, {endpoints, assert, wildcardApiClient});
