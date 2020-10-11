// Context validation logic:
// - The context can be undefined, but then an error is shown upon any attempt to read the context
// - Context functions are not allowed to return undefined
// The goal being:
// - Browser-side and client-side usage of the Wildcard client should behave identically
// - Show an error when the user forgets to `bind()` while doing SSR
// - Keep things JS-esque and simple

const { createServer } = require("./details");

module.exports = [
  // Set context with `setContext`
  defineWith_setContext1,
  defineWith_setContext2,
  // Set context with `bind()`
  defineWith_bind,
  // Set context with `getApiHttpResponse`
  defineWith_getApiHttpResponse,

  // The context is `undefined`
  undefinedContext1,
  undefinedContext_getApiHttpResponse1,
  undefinedContext_getApiHttpResponse2,

  setContextReturnsUndefined1,
  setContextReturnsUndefined2,
  setContextReturnsWrongValue1,
  wrongContext_getApiHttpResponse,

  setContextError1,
  setContextError2,

  // The context is the emtpy object `{}`
  emptyContext1,
  emptyContext2,
  emptyContext3,
  emptyContext_getApiHttpResponse,

  contextImmutable,
];

// Async `setContext`
defineWith_setContext1.isIntegrationTest = true;
async function defineWith_setContext1(args) {
  const setContext = async () => ({ userId: 4242 });
  await testSetContext({ setContext, ...args });
}
// Sync `setContext`
defineWith_setContext2.isIntegrationTest = true;
async function defineWith_setContext2(args) {
  const setContext = () => ({ userId: 4242 });
  await testSetContext({ setContext, ...args });
}
async function testSetContext({ setContext, browserEval, ...args }) {
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

async function defineWith_bind({ server, wildcardClient }) {
  const numbers = [1, 2, 3];
  server.hello = async function (prefix) {
    assert(this.numbers === numbers);
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    return prefix + sum(this.numbers);
  };
  let { hello } = wildcardClient.endpoints;
  hello = hello.bind({ numbers });
  const res = await hello("Total: ");
  assert(res === "Total: 6");
}

undefinedContext1.isIntegrationTest = true;
async function undefinedContext1(args) {
  const setContext = undefined;
  await undefinedContext({ setContext, ...args });
}
async function undefinedContext({
  setContext,
  browserEval,
  assertStderr,
  ...args
}) {
  const { stopApp, server, wildcardClient } = await createServer({
    setContext,
    ...args,
  });

  /*
   * Can call endpoints that don't use the context
   */

  server.contextLessFunc = async function (msg) {
    return "works fine " + msg;
  };

  const ret_serverSide = await wildcardClient.endpoints.contextLessFunc("rom");
  assert(ret_serverSide === "works fine rom");

  await browserEval(async () => {
    const ret_browserSide = await window.server.contextLessFunc("romi");
    assert(ret_browserSide === "works fine romi");
  });

  /*
   * Cannot call endpoints that use the context
   */

  server.ctxFunc = async function () {
    return this.notExistingContext + " blib";
  };

  const errMsg =
    "[Wildcard API][Wrong Usage] Wrong usage of the Wildcard client in Node.js. Your endpoint function `ctxFunc` is trying to get `this.notExistingContext`, but you didn't define any context and as a result `this` is `undefined`. Make sure to provide a context by using `bind({notExistingContext})` when calling your `ctxFunc` endpoint in Node.js. More infos at https://github.com/reframejs/wildcard-api/blob/master/docs/ssr-auth.md";
  let err;
  try {
    await wildcardClient.endpoints.ctxFunc();
  } catch (_err) {
    err = _err;
  }
  assert(err.stack.includes(errMsg));

  await browserEval(async () => {
    try {
      await window.server.ctxFunc();
    } catch (err) {
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
      assert(err.message === "Endpoint function `ctxFunc` threw an error.");
    }
  });
  assertStderr(
    "[Wildcard API][Wrong Usage] Your endpoint function `ctxFunc` is trying to get `this.notExistingContext`, but you didn't define any context and as a result `this` is `undefined`. Make sure to provide a context with the `setContext` function when using the `wildcard(setContext)` express middleware."
  );

  await stopApp();
}

setContextReturnsUndefined1.isIntegrationTest = true;
async function setContextReturnsUndefined1(args) {
  const setContext = () => undefined;
  await wrongSetContext({ setContext, ...args });
}
setContextReturnsUndefined2.isIntegrationTest = true;
async function setContextReturnsUndefined2(args) {
  const setContext = async () => undefined;
  await wrongSetContext({ setContext, ...args });
}
async function wrongSetContext({
  setContext,
  browserEval,
  assertStderr,
  ...args
}) {
  const { stopApp, server, wildcardClient } = await createServer({
    setContext,
    ...args,
  });

  /*
   * Cannot call any endpoint
   */

  server.boringEndpoint = function () {};

  await browserEval(async () => {
    try {
      await window.server.boringEndpoint();
    } catch (err) {
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
      assert(
        err.message === "Endpoint function `boringEndpoint` threw an error."
      );
    }
  });
  assertStderr(
    "Your context function `setContext` should return a `instanceof Object`."
  );

  await stopApp();
}

emptyContext1.isIntegrationTest = true;
async function emptyContext1(args) {
  const setContext = {};
  await emptyContext({ setContext, ...args });
}
emptyContext2.isIntegrationTest = true;
async function emptyContext2(args) {
  const setContext = () => ({});
  await emptyContext({ setContext, ...args });
}
emptyContext3.isIntegrationTest = true;
async function emptyContext3(args) {
  const setContext = async () => ({});
  await emptyContext({ setContext, ...args });
}
async function emptyContext({ setContext, browserEval, ...args }) {
  const { stopApp, server, wildcardClient } = await createServer({
    setContext,
    ...args,
  });

  server.ctxEndpoint = async function () {
    return this.notExistingContext + " blib";
  };

  await browserEval(async () => {
    const ret_browserSide = await window.server.ctxEndpoint();
    assert(ret_browserSide === "undefined blib");
  });

  const ret_serverSide = await wildcardClient.endpoints.ctxEndpoint.bind({})();
  assert(ret_serverSide === "undefined blib");

  await stopApp();
}

async function defineWith_getApiHttpResponse({ server, wildcardServer }) {
  server.square = function () {
    return this.ctxInfo * this.ctxInfo;
  };
  const url = "https://example.org/_wildcard_api/square";
  const method = "POST";
  const context = { ctxInfo: 3 };
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assert(responseProps.statusCode === 200);
  assert(responseProps.body === `9`);
}
async function undefinedContext_getApiHttpResponse1({
  server,
  wildcardServer,
  assertStderr,
}) {
  server.contexti1 = function () {
    return this.doesNotExist + " abc";
  };
  const url = "https://example.org/_wildcard_api/contexti1";
  const method = "POST";
  const context = async () => undefined;
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr(
    "Your context function `context` should return a `instanceof Object`."
  );
}
async function undefinedContext_getApiHttpResponse2({
  server,
  wildcardServer,
  assertStderr,
}) {
  server.contexti2 = function () {
    return this.doesNotExist + " abc";
  };
  const url = "https://example.org/_wildcard_api/contexti2";
  const method = "POST";
  const context = undefined;
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr(
    "Error: [Wildcard API][Wrong Usage] Your endpoint function `contexti2` is trying to get `this.doesNotExist`, but you didn't define any context and as a result `this` is `undefined`. Make sure to provide a context when using `getApiHttpResponse(requestProps, context)`."
  );
}
async function wrongContext_getApiHttpResponse({
  wildcardServer,
  assertStderr,
}) {
  const url = "https://example.org/_wildcard_api/ummm";
  const method = "GET";
  const context = null;
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr("The context should be a `instanceof Object`.");
}
async function emptyContext_getApiHttpResponse({ server, wildcardServer }) {
  server.contexti3 = function () {
    return this.doesNotExist + " abc";
  };
  const url = "https://example.org/_wildcard_api/contexti3";
  const method = "POST";
  const context = {};
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assert(responseProps.statusCode === 200);
  assert(responseProps.body === `"undefined abc"`);
}
async function setContextError1({ server, wildcardServer, assertStderr }) {
  server.contexti4 = function () {};

  const url = "https://example.org/_wildcard_api/contexti4";
  const method = "POST";
  const errMsg = "[TEST-ERROR] User-error in context function";
  const context = async () => {
    throw new Error(errMsg);
  };
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr(errMsg);
}

setContextReturnsWrongValue1.isIntegrationTest = true;
async function setContextReturnsWrongValue1({ assertStderr, ...args }) {
  const setContext = () => "wrong-context-type";

  await _createAndCallAnEndpoint({ setContext, ...args });

  assertStderr(
    "Your context function `setContext` should return a `instanceof Object`."
  );
}
async function _createAndCallAnEndpoint({ setContext, browserEval, ...args }) {
  const { stopApp, server } = await createServer({
    setContext,
    ...args,
  });

  let endpointCalled = false;
  server.failingEndpoint = async function (name) {
    endpointCalled = true;
    return "Dear " + name;
  };

  await browserEval(async () => {
    let err;
    try {
      await window.server.failingEndpoint("rom");
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
    assert(
      err.message === "Endpoint function `failingEndpoint` threw an error."
    );
  });

  assert(endpointCalled === false);

  await stopApp();
}

setContextError2.isIntegrationTest = true;
async function setContextError2({ assertStderr, ...args }) {
  const errText = "[TEST-ERROR] err" + Math.random();
  const setContext = async () => {
    throw new Error(errText);
  };

  await _createAndCallAnEndpoint({ setContext, ...args });

  assertStderr(errText);
}

async function contextImmutable({
  server,
  wildcardClient,
  browserEval,
  assertStderr,
}) {
  server.he = async function () {
    this.nop = 11;
  };
  const errMsg = "The context object cannot be modified.";

  try {
    await wildcardClient.endpoints.he();
  } catch (err) {
    assert(err.stack.includes(errMsg));
  }

  await browserEval(async () => {
    try {
      await window.server.he();
    } catch (err) {
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
      assert(err.message === "Endpoint function `he` threw an error.");
    }
  });

  assertStderr(errMsg);
}
