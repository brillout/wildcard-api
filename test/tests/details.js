// Unimportant details
// But they need to stay backwards compatible
// Should include all possible details

module.exports = [
  // Endpoint functions
  endpointSyncFunction,
  endpointReturnsUndefined_serverSide,
  endpointReturnsUndefined_browserSide,

  // Calling a server endpoint directly without using the `@wilcard-api/client` is not a problem
  serverSideEndpointCalling,
];
module.exports.createServer = createServer;

// Endpoints can be synchronous
async function endpointSyncFunction({ server, wildcardClient }) {
  const n = Math.random();
  server.syncFunc = function () {
    return n;
  };
  const promise = wildcardClient.endpoints.syncFunc();
  assert(!promise !== n);
  assert(promise.then);
  const ret = await promise;
  assert(ret === n);
}
// Endpoints can return undefined
async function endpointReturnsUndefined_serverSide({ server, wildcardClient }) {
  server.helloUndefined = async function () {};
  const endpointResult = await wildcardClient.endpoints.helloUndefined();
  assert(endpointResult === undefined);
}
async function endpointReturnsUndefined_browserSide({ server, browserEval }) {
  server.helloUndefined = async function () {};
  await browserEval(async () => {
    const endpointResult = await window.server.helloUndefined("Hm");
    assert(endpointResult === undefined);
  });
}

async function createServer({
  WildcardServer,
  WildcardClient,
  setContext,
  staticDir,
  httpPort,
}) {
  const express = require("express");
  const { wildcard } = require("telefunc/server/express");
  const { stop, start } = require("../setup/servers/express");

  const wildcardServer = new WildcardServer();
  const wildcardClient = new WildcardClient();
  wildcardClient.config.__INTERNAL_wildcardServer_test = wildcardServer;

  const app = express();

  app.use(express.json());

  app.use(express.static(staticDir, { extensions: ["html"] }));

  app.use(
    wildcard(setContext, {
      __INTERNAL_wildcardServer_middleware: { wildcardServer },
    })
  );

  const server = await start(app, httpPort);
  const stopApp = async () => {
    await stop(server);
  };

  return {
    stopApp,
    server: wildcardServer.endpoints,
    wildcardClient,
  };
}

async function serverSideEndpointCalling({ server }) {
  const val = "yep this works" + Math.random();
  server.writeOnlyEndpoint = function () {
    return val;
  };
  const ret = server.writeOnlyEndpoint();
  assert(ret === val);
}

