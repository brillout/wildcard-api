const Hapi = require('hapi');
const Inert = require('inert');
const assert = require('@brillout/assert');

module.exports = startServer;

async function startServer({wildcardApiHolder, httpPort, staticDir}) {
  const server = Hapi.Server({
    port: httpPort,
    debug: {request: ['internal']},
  });

  server.ext('onPreResponse', wildcardHandler);

  await server.register(Inert);
  server.route({
    method: '*',
    path: '/{param*}',
    handler: {
      directory: {
        path: staticDir,
      }
    }
  });

  await server.start();

  return () => server.stop();

  async function wildcardHandler(request, h) {
    const requestProps = {
      url: request.url,
      method: request.method,
      body: request.payload,
    };
    const context = {
      headers: request.headers,
    };
    const responseProps = await wildcardApiHolder.wildcardApi.getApiHttpResponse(requestProps, context);
    if( responseProps === null ){
      return h.continue;
    }
    {
      const {body, statusCode, contentType} = responseProps;
      assert.internal(body);
      assert.internal(statusCode);
      assert.internal(contentType);
      const response = h.response(body);
      response.code(statusCode);
      response.type(contentType);
      return response;
    }
  }
}
