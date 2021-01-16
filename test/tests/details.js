// Unimportant details
// But they need to stay backwards compatible
// Should include all possible details

module.exports = [
  // Telefunction definition
  telefunctionSyncFunction,
  telefunctionReturnsUndefined_serverSide,
  telefunctionReturnsUndefined_browserSide,

  // Calling a server telefunction directly without using the `telefunc/client` is not a problem
  serverSideTelefunctionCalling,
];
module.exports.createServer = createServer;

// Telefunctions can be synchronous
async function telefunctionSyncFunction({ server, telefuncClient }) {
  const n = Math.random();
  server.syncFunc = function () {
    return n;
  };
  const promise = telefuncClient.telefunctions.syncFunc();
  assert(!promise !== n);
  assert(promise.then);
  const ret = await promise;
  assert(ret === n);
}
// Telefunctions can return undefined
async function telefunctionReturnsUndefined_serverSide({ server, telefuncClient }) {
  server.helloUndefined = async function () {};
  const telefunctionResult = await telefuncClient.telefunctions.helloUndefined();
  assert(telefunctionResult === undefined);
}
async function telefunctionReturnsUndefined_browserSide({ server, browserEval }) {
  server.helloUndefined = async function () {};
  await browserEval(async () => {
    const telefunctionResult = await window.telefunc.server.helloUndefined(
      "Hm"
    );
    assert(telefunctionResult === undefined);
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
    server: telefuncServer.telefunctions,
    telefuncClient,
  };
}

async function serverSideTelefunctionCalling({ server }) {
  const val = "yep this works" + Math.random();
  server.writeOnlyTelefunction = function () {
    return val;
  };
  const ret = server.writeOnlyTelefunction();
  assert(ret === val);
}
