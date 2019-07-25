const HapiAdapter = require('@universal-adapter/hapi');
const universalRequestHandler = require('./universalRequestHandler');
module.export = new HapiAdapter([universalRequestHandler]);
