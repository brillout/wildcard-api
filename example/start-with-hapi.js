const Hapi = require('hapi');
const Inert = require('inert');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

startServer();

async function startServer() {
  const server = Hapi.Server({
    port: 3000,
    debug: {request: ['internal']},
  });

  server.route({
    method: '*',
    path: '/wildcard/{param*}',
    handler: async (request, h) => {
      // Our `context` object is made available to endpoint functions over `this`.
      // E.g. `endpoints.getUser = function() { return getLoggedUser(this.headers) }`.
      const {method, url, headers} = request.raw.req;
      const context = {method, url, headers};
      const apiResponse = await getApiResponse(context);

      if( apiResponse ) {
        const resp = h.response(apiResponse.body);
        resp.code(apiResponse.statusCode);
        return resp;
      }

      return h.continue;
    }
  });

  await server.register(Inert);
  server.route({
    method: '*',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'client/dist',
      }
    }
  });

  await server.start();
}
