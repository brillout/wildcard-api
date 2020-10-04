const Hapi = require("hapi");
const Inert = require("inert");
const assert = require("@brillout/assert");
const { wildcard } = require("@wildcard-api/server/hapi");

module.exports = startServer;

async function startServer({ wildcardApiHolder, httpPort, staticDir }) {
  const server = Hapi.Server({
    port: httpPort,
    debug: { request: ["internal"] },
  });

  server.register(
    wildcard(
      async (request) => {
        const { headers } = request;
        const context = { headers };
        return context;
      },
      { __INTERNAL__wildcardServerHolder: wildcardApiHolder }
    )
  );

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
