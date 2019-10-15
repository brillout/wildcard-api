const assert = require('@brillout/reassert');
const Hapi = require('hapi');
const Inert = require('@hapi/inert');
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
      assert.internal(request.url);
      assert.internal(request.method);
      assert.internal('payload' in request);
      assert.internal(request.method!=='POST' || request.payload.constructor===Array);
      assert.internal(request.headers.constructor===Object);

      const requestProps = {
        url: request.url,
        method: request.method,
        body: request.payload,
        headers: request.headers,
      };

      const responseProps = await getApiResponse(requestProps);

      const response = h.response(responseProps.body);
      response.code(responseProps.statusCode);
      response.type(responseProps.contentType);
      return response;
    },
  });

  await server.register(Inert);
  server.route({
    method: '*',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'client/dist',
        defaultExtension: 'html',
      }
    }
  });

  await server.start();

  console.log('Server is running, go to http://localhost:3000')
}
