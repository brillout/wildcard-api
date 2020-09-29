module.exports = [
  missingContext,
  missingContextSSR,
  missingContextFunction,
  missingContextObject,
  wrongContextObject,
];

async function missingContext({ wildcardApi, browserEval }) {
  let endpointFunctionCalled = false;
  wildcardApi.endpoints.ctxEndpoint = async function () {
    endpointFunctionCalled = true;
    return this.notExistingContext + " bla";
  };

  await browserEval(async () => {
    const ret = await window.endpoints.ctxEndpoint();
    assert(ret === "undefined bla");
  });

  assert(endpointFunctionCalled === true);
}

async function missingContextSSR({ wildcardApi, wildcardClient }) {
  let endpointFunctionCalled = false;
  wildcardApi.endpoints.ssrTest = async function () {
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
  const getContext = undefined;
  const { stopServer, wildcardApi } = await createServer({
    getContext,
    ...args,
  });

  let endpointFunctionCalled = false;
  wildcardApi.endpoints.ctxEndpoint = async function () {
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
async function missingContextObject({ stdoutLogs, stderrLogs, ...args }) {
  const getContext = () => undefined;
  const { stopServer, wildcardApi } = await createServer({
    getContext,
    ...args,
  });

  await test_failedEndpointCall({ wildcardApi, ...args });

  await stopServer();

  assert(
    stderrIncludes(
      stderrLogs,
      "Your context getter should return an object but it returns `undefined`."
    )
  );
  assert(noStdoutSpam(stdoutLogs));
}

wrongContextObject.isIntegrationTest = true;
async function wrongContextObject({ stdoutLogs, stderrLogs, ...args }) {
  const getContext = () => "wrong-context-type";
  const { stopServer, wildcardApi } = await createServer({
    getContext,
    ...args,
  });

  await test_failedEndpointCall({ wildcardApi, ...args });

  await stopServer();

  assert(
    stderrIncludes(
      stderrLogs,
      "Your context getter should return an object but it returns `context.constructor===String`."
    )
  );
  assert(noStdoutSpam(stdoutLogs), { stdoutLogs });
}

function stderrIncludes(stderrLogs, str) {
  return stderrLogs.find((log) => log.includes(str));
}
function noStdoutSpam(stdoutLogs) {
  return (
    stdoutLogs.length === 2 &&
    // Browser-side puppeteer log
    stdoutLogs[0] ===
      "Failed to load resource: the server responded with a status of 500 (Internal Server Error)\n" &&
    // Puppeteer "hidden" log (never saw such hidden log before; no clue how and why this exists)
    stdoutLogs[1].includes(
      "This conditional evaluates to true if and only if there was an error"
    )
  );
}

async function test_failedEndpointCall({ wildcardApi, ...args }) {
  let endpointCalled = false;
  wildcardApi.endpoints.failingEndpoint = async function (name) {
    endpointCalled = true;
    return "Dear " + name;
  };

  await callFailaingEndpoint(args);

  assert(endpointCalled === false);
}

async function createServer({ getContext, staticDir, httpPort }) {
  const express = require("express");
  const wildcard = require("@wildcard-api/server/express");
  const WildcardApi = require("@wildcard-api/server/WildcardApi");
  const { stop, start } = require("../setup/servers/express");

  const wildcardApi = new WildcardApi();

  const app = express();

  app.use(express.json());

  app.use(express.static(staticDir, { extensions: ["html"] }));

  app.use(
    wildcard(getContext, { __INTERNAL__wildcardApiHolder: { wildcardApi } })
  );

  const server = await start(app, httpPort);

  const stopServer = () => stop(server);
  return { stopServer, wildcardApi };
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
