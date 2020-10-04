module.exports = [
  missingContext,
  missingContextSSR,
  missingContextFunction,
  missingContextObject,
  wrongContextObject,
];

async function missingContext({ wildcardServer, browserEval }) {
  let endpointFunctionCalled = false;
  wildcardServer.endpoints.ctxEndpoint = async function () {
    endpointFunctionCalled = true;
    return this.notExistingContext + " bla";
  };

  await browserEval(async () => {
    const ret = await window.endpoints.ctxEndpoint();
    assert(ret === "undefined bla");
  });

  assert(endpointFunctionCalled === true);
}

async function missingContextSSR({ wildcardServer, wildcardClient }) {
  let endpointFunctionCalled = false;
  wildcardServer.endpoints.ssrTest = async function () {
    let errorThrown = false;
    try {
      this.headers;
    } catch (err) {
      errorThrown = true;
      assert(err);
      assert(
        err.stack.includes(
          "Make sure to provide `headers` by using `bind({headers})` when calling your `ssrTest` endpoint in Node.js"
        ),
        err.stack
      );
    }
    assert(errorThrown === true);
    endpointFunctionCalled = true;
  };

  await wildcardClient.endpoints.ssrTest();
  assert(endpointFunctionCalled === true);
}

missingContextFunction.isIntegrationTest = true;
async function missingContextFunction({ browserEval, ...args }) {
  const setContext = undefined;
  const { stopServer, wildcardServer } = await createServer({
    setContext,
    ...args,
  });

  let endpointFunctionCalled = false;
  wildcardServer.endpoints.ctxEndpoint = async function () {
    endpointFunctionCalled = true;
    return this.notExistingContext + " blib";
  };

  await browserEval(async () => {
    const ret = await window.endpoints.ctxEndpoint();
    assert(ret === "undefined blib");
  });

  assert(endpointFunctionCalled === true);

  await stopServer();
}

missingContextObject.isIntegrationTest = true;
async function missingContextObject({ assertStderr, ...args }) {
  const setContext = () => undefined;
  const { stopServer, wildcardServer } = await createServer({
    setContext,
    ...args,
  });

  await test_failedEndpointCall({ wildcardServer, ...args });

  await stopServer();

  assertStderr(
    "Your context getter should return an object but it returns `undefined`."
  );
}

wrongContextObject.isIntegrationTest = true;
async function wrongContextObject({ assertStderr, ...args }) {
  const setContext = () => "wrong-context-type";
  const { stopServer, wildcardServer } = await createServer({
    setContext,
    ...args,
  });

  await test_failedEndpointCall({ wildcardServer, ...args });

  await stopServer();

  assertStderr(
    "Your context getter should return an object but it returns `context.constructor===String`."
  );
}

async function test_failedEndpointCall({ wildcardServer, ...args }) {
  let endpointCalled = false;
  wildcardServer.endpoints.failingEndpoint = async function (name) {
    endpointCalled = true;
    return "Dear " + name;
  };

  await callFailaingEndpoint(args);

  assert(endpointCalled === false);
}

async function createServer({ setContext, staticDir, httpPort }) {
  const express = require("express");
  const { wildcard } = require("@wildcard-api/server/express");
  const { WildcardServer } = require("@wildcard-api/server");
  const { stop, start } = require("../setup/servers/express");

  const wildcardServer = new WildcardServer();

  const app = express();

  app.use(express.json());

  app.use(express.static(staticDir, { extensions: ["html"] }));

  app.use(
    wildcard(setContext, {
      __INTERNAL__wildcardServerHolder: { wildcardServer },
    })
  );

  const server = await start(app, httpPort);

  const stopServer = () => stop(server);
  return { stopServer, wildcardServer };
}

async function callFailaingEndpoint({ browserEval }) {
  await browserEval(async () => {
    let errorThrown = false;
    try {
      const ret = await window.endpoints.failingEndpoint("rom");
      console.log("ret: ", ret);
    } catch (err) {
      assert(err.message === "Internal Server Error");
      errorThrown = true;
    }
    assert(errorThrown === true);
  });
}
