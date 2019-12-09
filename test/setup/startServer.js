const Hapi = require('hapi');
const Inert = require('inert');
const getTestPort = require('./getTestPort');

module.exports = startServer;

async function startServer(wildcardApiHolder) {
  const server = Hapi.Server({
    port: getTestPort(),
    debug: {request: ['internal']},
  });

  server.route({
    method: '*',
    path: '/wildcard/{param*}',
    handler: async (request, h) => {
      const requestProps = {
        url: request.url,
        method: request.method,
        body: request.payload,
      };
      const context = {
        headers: request.headers,
      };
      const responseProps = await wildcardApiHolder.wildcardApi.getApiResponse(requestProps, context);
      const response = h.response(responseProps.body);
      response.code(responseProps.statusCode);
      response.type(responseProps.contentType);
      return response;
    }
  });

  await server.register(Inert);
  server.route({
    method: '*',
    path: '/{param*}',
    handler: {
      directory: {
        path: __dirname+'/browser/dist/',
      }
    }
  });

  await server.start();

  return server;
}
