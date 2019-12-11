const MiddlewareFactory = require('./MiddlewareFactory');
const KoaAdapter = require('@universal-adapter/koa');
module.exports = MiddlewareFactory(KoaAdapter);
