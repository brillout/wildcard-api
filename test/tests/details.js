// Unimportant details
// But they need to stay backwards compatible
// Should include all possible details

module.exports = [
  // Endpoint functions
  endpointReturnsUndefined_serverSide,
  endpointReturnsUndefined_browserSide,

  // Context
  contextDoesNotExist,
  noContext1,
  noContext2,
  noContext3,
  asyncContextGetter,

  // Integration
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

noContext1.isIntegrationTest = true;
async function noContext1(args) {
  const setContext = undefined;
  await undefinedContext({ setContext, ...args });
}
noContext2.isIntegrationTest = true;
async function noContext2(args) {
  const setContext = () => undefined;
  await undefinedContext({ setContext, ...args });
}
noContext3.isIntegrationTest = true;
async function noContext3(args) {
  const setContext = async () => undefined;
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

asyncContextGetter.isIntegrationTest = true;
async function asyncContextGetter({ browserEval, ...args }) {
  const setContext = async () => ({ userId: 4242 });

  const { stopApp, server } = await createServer({
    setContext,
    ...args,
  });

  server.myEndpoint = async function () {
    return this.userId + "yep";
  };

  await browserEval(async () => {
    const ret = await window.server.myEndpoint();
    assert(ret === "4242yep");
  });

  await stopApp();
}
