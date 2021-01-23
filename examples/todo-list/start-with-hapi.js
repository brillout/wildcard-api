const Hapi = require("hapi");
const Inert = require("@hapi/inert");
const { telefunc } = require("telefunc/server/hapi");

startServer();

async function startServer() {
  const server = Hapi.Server({
    port: 3000,
    debug: { request: ["internal"] },
  });

  // Serve telefunctions
  await server.register(telefunc());

  // Serve index.html
  await server.register(Inert);
  server.route({
    method: "*",
    path: "/{param*}",
    handler: {
      directory: {
        path: "./browser/dist/",
        defaultExtension: "html",
      },
    },
  });

  await server.start();

  console.log("Hapi server is running, go to http://localhost:3000");
}
