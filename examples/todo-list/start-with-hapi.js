const Hapi = require("hapi");
const Inert = require("@hapi/inert");
const { wildcard } = require("telefunc/server/hapi");

startServer();

async function startServer() {
  const server = Hapi.Server({
    port: 3000,
    debug: { request: ["internal"] },
  });

  await server.register(
    wildcard(async (request) => {
      const { headers } = request;
      const context = { headers };
      return context;
    })
  );

  await server.register(Inert);
  server.route({
    method: "*",
    path: "/{param*}",
    handler: {
      directory: {
        path: "client/dist",
        defaultExtension: "html",
      },
    },
  });

  await server.start();

  console.log("Hapi server is running, go to http://localhost:3000");
}
