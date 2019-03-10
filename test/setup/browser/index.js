require('babel-polyfill');
const {endpoints} = require('../../../client');
const assert = require('reassert');
Object.assign(window, {endpoints, assert});
