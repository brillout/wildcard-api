const KoaAdapter = require('@universal-adapter/koa');
const universalRequestHandler = require('./universalRequestHandler');
module.export = new KoaAdapter([universalRequestHandler]);
