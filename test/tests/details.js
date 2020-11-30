// Unimportant details
// But they need to stay backwards compatible
// Should include all possible details

module.exports = [
  // Endpoint functions
  endpointSyncFunction,
  endpointReturnsUndefined_serverSide,
  endpointReturnsUndefined_browserSide,

  // Calling a server endpoint directly without using the `telefunc/client` is not a problem
  serverSideEndpointCalling,
];
module.exports.createServer = createServer;

// Endpoints can be synchronous
async function endpointSyncFunction({ server, telefuncClient }) {
  const n = Math.random();
  server.syncFunc = function () {
    return n;
  };
  const promise = telefuncClient.endpoints.syncFunc();
  assert(!promise !== n);
  assert(promise.then);
  const ret = await promise;
  assert(ret === n);
}
// Endpoints can return undefined
async function endpointReturnsUndefined_serverSide({ server, telefuncClient }) {
  server.helloUndefined = async function () {};
  const endpointResult = await telefuncClient.endpoints.helloUndefined();
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
  TelefuncServer,
  TelefuncClient,
  setContext,
  staticDir,
  httpPort,
}) {
  const express = require("express");
  const { telefunc } = require("telefunc/server/express");
  const { stop, start } = require("../setup/servers/express");

  const telefuncServer = new TelefuncServer();
  const telefuncClient = new TelefuncClient();
  telefuncClient.config.__INTERNAL_telefuncServer_test = telefuncServer;

  const app = express();

  app.use(express.json());

  app.use(express.static(staticDir, { extensions: ["html"] }));

  app.use(
    telefunc(setContext, {
      __INTERNAL_telefuncServer_middleware: { telefuncServer },
    })
  );

  const server = await start(app, httpPort);
  const stopApp = async () => {
    await stop(server);
  };

  return {
    stopApp,
    app,
    telefuncServer,
    server: telefuncServer.endpoints,
    telefuncClient,
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

