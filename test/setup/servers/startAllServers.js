const path = require("path");
const staticDir = path.resolve(__dirname + "/../browser/dist/");

module.exports = startAllServers;

async function startAllServers(wildcardApiHolder) {
  const servers = await Promise.all(
    [
      { serverFramework: "getApiHttpResponse", httpPort: 3441 },
      { serverFramework: "express", httpPort: 3442 },
      { serverFramework: "koa", httpPort: 3443 },
      { serverFramework: "hapi", httpPort: 3444 },
    ].map(async ({ serverFramework, httpPort }) => {
      const startServer = require("./" + serverFramework);
      const stop = await startServer({
        wildcardApiHolder,
        httpPort,
        staticDir,
      });
      return { serverFramework, httpPort, stop };
    })
  );
  return servers;
}
