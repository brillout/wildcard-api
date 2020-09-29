module.exports = [
  validUsage1,
  validUsage2,
  wrongUrl1,
  wrongUrl2,
  wrongUrl3,
  noEndpoints,
  noEndpoints2,
  endpointDoesNotExist,
  ssrMissingRequestProps,
  missingContext,
  wrongContext,
];

async function validUsage1({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/["Mom"]', {method: 'POST'});
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 200, resp.status);
    assert(text==='"Yo Mom!"', { text });
  });
}

async function validUsage2({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/%5B%22Mom%22%5D", {method: 'POST'});
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 200, resp.status);
    assert(text==='"Yo Mom!"', { text });
  });
}

async function wrongUrl1({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function () {};

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api//hello");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API URL `/_wildcard_api//hello`"), {
      text,
    });
    assert(text.includes("API URL should have following format:"), { text });
  });
}

async function wrongUrl2({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/wrongArgSyntax");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 400, resp.status);
    assert(
      text.includes(
        "Malformatted API request `/_wildcard_api/hello/wrongArgSyntax`"
      ),
      { text }
    );
    assert(text.includes("The URL arguments should be a JSON array."), {
      text,
    });
  });
}

async function wrongUrl3({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/{}");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 400, resp.status);
    assert(
      text.includes("Malformatted API request `/_wildcard_api/hello/{}`"),
      { text }
    );
    assert(text.includes("The URL arguments should be a JSON array."), {
      text,
    });
  });
}

async function noEndpoints({ wildcardApi, browserEval }) {
  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `hello` doesn't exist."), { text });
    assert(text.includes("You didn't define any endpoints."), { text });
    assert(
      text.includes("Make sure that the file that defines `hello` is named"),
      { text }
    );
  });
}

async function noEndpoints2({ wildcardApi, wildcardClient }) {
  let errorThrown = false;
  try {
    await wildcardClient.endpoints.helloSsr();
  } catch (err) {
    errorThrown = true;
    assert(err.stack.includes("Endpoint `helloSsr` doesn't exist."), err.stack);
    assert(err.stack.includes("You didn't define any endpoints."), err.stack);
    assert(
      err.stack.includes(
        "Make sure that the file that defines `helloSsr` is named"
      ),
      err.stack
    );
  }
  assert(errorThrown === true);
}

async function endpointDoesNotExist({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/blub");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `blub` doesn't exist."), { text });
    assert(!text.includes("You didn't define any endpoints."), { text });
  });
}

async function ssrMissingRequestProps({ wildcardApi, wildcardClient }) {
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

missingContext.isIntegrationTest = true;
async function missingContext({stdoutLogs, stderrLogs, ...args}) {
  const getContext = () => undefined;
  const {stopServer, wildcardApi} = await createserver({getContext, ...args});

  await test_failedEndpointCall({wildcardApi, ...args});

  await stopServer();

  assert(stderrIncludes(
    stderrLogs,
    'Your context getter should return an object but it returns `undefined`.',
  ));
  assert(noStdoutSpam(stdoutLogs));
}

wrongContext.isIntegrationTest = true;
async function wrongContext({stdoutLogs, stderrLogs, ...args}) {
  const getContext = () => 'wrong-context-type';
  const {stopServer, wildcardApi} = await createserver({getContext, ...args});

  await test_failedEndpointCall({wildcardApi, ...args});

  await stopServer();

  assert(stderrIncludes(
    stderrLogs,
    'Your context getter should return an object but it returns `context.constructor===String`.',
  ));
  assert(noStdoutSpam(stdoutLogs), {stdoutLogs});
}

function stderrIncludes(stderrLogs, str) {
  return stderrLogs.find(log => log.includes(str));
}
function noStdoutSpam(stdoutLogs) {
  return (
    stdoutLogs.length===2 &&
    // Browser-side puppeteer log
    stdoutLogs[0]==='Failed to load resource: the server responded with a status of 500 (Internal Server Error)\n' &&
    // Puppeteer "hidden" log (never saw such hidden log before; no clue how and why this exists)
    stdoutLogs[1].includes('This conditional evaluates to true if and only if there was an error')
  );
}

async function test_failedEndpointCall({wildcardApi, browserEval}) {
  let endpointCalled = false;
  wildcardApi.endpoints.hello = async function (name) {
    endpointCalled = true;
    return "Dear " + name;
  };

  await browserEval(async () => {
    let errorThrown = false;
    try {
      await window.endpoints.hello("rom");
    } catch(err){
      assert(err.message==='Internal Server Error');
      errorThrown = true;
    }
    assert(errorThrown===true);
  });

  assert(endpointCalled===false);
}

async function createserver({getContext, staticDir, httpPort}) {
  const express = require("express");
  const wildcard = require("@wildcard-api/server/express");
  const WildcardApi = require("@wildcard-api/server/WildcardApi");
  const {stop, start} = require('../setup/servers/express');

  const wildcardApi = new WildcardApi();

  const app = express();

  app.use(express.json());

  app.use(express.static(staticDir, { extensions: ["html"] }));

  app.use(wildcard(getContext));

  const server = await start(app, httpPort);

  const stopServer = () => stop(server);
  return {stopServer, wildcardApi};
}
