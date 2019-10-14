require('babel-polyfill');
const {endpoints, WildcardClient} = require('../../../client');
const assert = require('@brillout/reassert');
Object.assign(window, {endpoints, assert, WildcardClient});
