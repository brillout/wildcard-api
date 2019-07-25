const Hapi = require('hapi');
const Inert = require('@hapi/inert');
const {getApiResponse} = require('wildcard-api');
const wildcardApi = require('wildcard-api/hapi');
require('./api/endpoints');

startServer();

async function startServer() {
  const server = Hapi.Server({
    port: 3000,
    debug: {request: ['internal']},
  });

  //*
  server.route({
    method: '*',
    path: '/wildcard/{param*}',
    handler: async (request, h) => {
      const apiResponse = await getApiResponse(request);
      const resp = h.response(apiResponse.body);
      resp.code(apiResponse.statusCode);
      resp.type(apiResponse.contentType);
      return resp;
    },
  });
  /*/
  await server.register(wildcardApi);
  //*/

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

  console.log('Server is running. Go to http://localhost:3000')
}
