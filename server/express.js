const MiddlewareFactory = require('./MiddlewareFactory');
const ExpressAdapter = require('@universal-adapter/express');
module.exports = MiddlewareFactory(ExpressAdapter);
