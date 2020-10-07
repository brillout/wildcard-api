// Unimportant details
// But they need to stay backwards compatible
// Should include all possible details

module.exports = [
  // Endpoint functions
  endpointSyncFunction,
  endpointReturnsUndefined_serverSide,
  endpointReturnsUndefined_browserSide,

  // Context
  contextDoesNotExist,
  noContext1,
  noContext2,
  noContext3,
  contextGetterAsync,
  contextGetterSync,

  // Integration
  serverSideEndpointCalling,
];
module.exports.createServer = createServer;

// Endpoints can return undefined
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

// Tyring to read an undefined context prop returns undefined
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

// The context can be undefined
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

// Calling a server endpoint without using the `@wilcard-api/client` is fine
async function serverSideEndpointCalling({ server }) {
  const val = "yep this works" + Math.random();
  server.writeOnlyEndpoint = function () {
    return val;
  };
  const ret = server.writeOnlyEndpoint();
  assert(ret === val);
}

// The context getter can be async as well as sync
contextGetterAsync.isIntegrationTest = true;
async function contextGetterAsync(args) {
  const setContext = async () => ({ userId: 4242 });
  await testContextGetter({ setContext, ...args });
}
contextGetterSync.isIntegrationTest = true;
async function contextGetterSync(args) {
  const setContext = () => ({ userId: 4242 });
  await testContextGetter({ setContext, ...args });
}
async function testContextGetter({ setContext, browserEval, ...args }) {
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
