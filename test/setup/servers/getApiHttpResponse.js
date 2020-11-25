const Hapi = require("hapi");
const Inert = require("inert");
const { assert } = require("@brillout/assert");

module.exports = startServer;

async function startServer({
  __INTERNAL_telefuncServer_middleware,
  httpPort,
  staticDir,
}) {
  const server = Hapi.Server({
    port: httpPort,
    debug: { request: ["internal"] },
  });

  server.route({
    method: "POST",
    path: "/hey/after",
    handler: () => {
      return "Hello again";
    },
  });

  server.ext("onPreResponse", telefuncHandler);

  await server.register(Inert);
  server.route({
    method: "*",
    path: "/{param*}",
    handler: {
      directory: {
        path: staticDir,
      },
    },
  });

  server.route({
    method: "GET",
    path: "/hey-before",
    handler: () => {
      return "Hello darling";
    },
  });

  await server.start();

  return async () => {
    await server.stop();
  };

  async function telefuncHandler(request, h) {
    const requestProps = {
      url: request.url,
      method: request.method,
      body: request.payload,
    };
    const context = {
      headers: request.headers,
    };
    const responseProps = await __INTERNAL_telefuncServer_middleware.telefuncServer.getApiHttpResponse(
      requestProps,
      context
    );
    if (responseProps === null) {
      return h.continue;
    }
    {
      const { body, statusCode, contentType, headers } = responseProps;
      assert(body);
      assert(statusCode);
      assert(contentType);
      const response = h.response(body);
      response.code(statusCode);
      response.type(contentType);
      if (headers) {
        headers.forEach(({ name, value }) => response.header(name, value));
      }
      return response;
    }
  }
}
