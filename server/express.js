const ExpressAdapter = require('@universal-adapter/express');
const universalRequestHandler = require('./universalRequestHandler');
module.export = new ExpressAdapter([universalRequestHandler]);
