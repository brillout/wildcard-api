const HapiAdapter = require('@universal-adapter/hapi');
module.exports = MiddlewareFactory(HapiAdapter, {path: '/wildcard/{param*}'});
