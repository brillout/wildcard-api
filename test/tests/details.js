// Unimportant details
// But they need to stay backwards compatible
// Should include all possible details

module.exports = [
  endpointReturnsUndefined_serverSide,
  endpointReturnsUndefined_browserSide,
  contextDoesNotExist,
  noContextFunction,
  noContextObject1,
  serverSideEndpointCalling,
];
module.exports.createServer = createServer;

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

async function contextDoesNotExist({ server, browserEval }) {
  let endpointFunctionCalled = false;
  server.ctxEndpoint = async function () {
    endpointFunctionCalled = true;
    return this.notExistingContext + " bla";
  };

  await browserEval(async () => {
    const ret = await window.server.ctxEndpoint();
    assert(ret === "undefined bla");
  });

  assert(endpointFunctionCalled === true);
}

noContextFunction.isIntegrationTest = true;
async function noContextFunction(args) {
  const setContext = undefined;
  await undefinedContext({ setContext, ...args });
}

noContextObject1.isIntegrationTest = true;
async function noContextObject1(args) {
  const setContext = () => undefined;
  await undefinedContext({ setContext, ...args });
}

async function undefinedContext({ setContext, browserEval, ...args }) {
  const { stopApp, server } = await createServer({
    setContext,
    ...args,
  });

  let endpointFunctionCalled = false;
  server.ctxEndpoint = async function () {
    endpointFunctionCalled = true;
    return this.notExistingContext + " blib";
  };

  await browserEval(async () => {
    const ret = await window.server.ctxEndpoint();
    assert(ret === "undefined blib");
  });

  assert(endpointFunctionCalled === true);

  await stopApp();
}

async function createServer({
  WildcardServer,
  setContext,
  staticDir,
  httpPort,
}) {
  const express = require("express");
  const { wildcard } = require("@wildcard-api/server/express");
  const { stop, start } = require("../setup/servers/express");

  const wildcardServer = new WildcardServer();

  const app = express();

  app.use(express.json());

  app.use(express.static(staticDir, { extensions: ["html"] }));

  app.use(
    wildcard(setContext, {
      __INTERNAL_wildcardServer_middleware: { wildcardServer },
    })
  );

  const server = await start(app, httpPort);
  const stopApp = () => stop(server);

  return {
    stopApp,
    server: wildcardServer.endpoints,
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
