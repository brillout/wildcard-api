const Hapi = require('hapi');
const Inert = require('inert');

module.exports = startServer;

async function startServer(wildcardApiHolder) {
  const server = Hapi.Server({
    port: 3000,
    debug: {request: ['internal']},
  });

  server.route({
    method: '*',
    path: '/wildcard/{param*}',
    handler: async (request, h) => {
      const requestProps = {
        url: request.raw.req.url,
        method: request.raw.req.method,
        body: request.payload,
        headers: request.raw.req.headers,
      };
      const responseProps = await wildcardApiHolder.wildcardApi.getApiResponse(requestProps);
      /*
      console.log('p1');
      console.log(request.url);
      console.log(request.method);
      console.log(request.headers);
      console.log('p2');
      console.log(requestProps);
      console.log(responseProps);
      */
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
