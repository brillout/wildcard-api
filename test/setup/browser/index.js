require('babel-polyfill');
const {endpoints} = require('../../../client');
const assert = require('@brillout/reassert');
Object.assign(window, {endpoints, assert});
