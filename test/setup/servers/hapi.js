const Hapi = require("hapi");
const Inert = require("inert");
const { telefunc } = require("telefunc/server/hapi");

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
    method: "GET",
    path: "/hey-before",
    handler: () => {
      return "Hello darling";
    },
  });

  server.register(
    telefunc(
      async (request) => {
        const { headers } = request;
        const context = { headers };
        return context;
      },
      { __INTERNAL_telefuncServer_middleware }
    )
  );

  server.route({
    method: "POST",
    path: "/hey/after",
    handler: () => {
      return "Hello again";
    },
  });

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

  await server.start();

  return () => server.stop();
}
