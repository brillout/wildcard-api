const express = require("express");
const { wildcard } = require("@wildcard-api/server/express");

module.exports = startServer;
module.exports.start = start;
module.exports.stop = stop;

async function startServer({ wildcardServerHolder, httpPort, staticDir }) {
  const app = express();

  app.use(express.json());

  app.use(express.static(staticDir, { extensions: ["html"] }));

  app.use(
    wildcard(
      async (req) => {
        const { headers } = req;
        const context = { headers };
        return context;
      },
      { __INTERNAL__wildcardServerHolder: wildcardServerHolder }
    )
  );

  const server = await start(app, httpPort);

  return () => stop(server);
}

async function start(app, httpPort) {
  const http = require("http");
  const server = http.createServer(app);
  const p = new Promise((r, f) => {
    server.on("listening", () => {
      r();
    });
    server.on("error", f);
  });
  server.listen(httpPort);
  // Wait until the server has started
  await p;
  return server;
}
async function stop(server) {
  server.close();
  // Wait until server closes
  await new Promise((r, f) => {
    server.on("close", r);
    server.on("error", f);
  });
}
