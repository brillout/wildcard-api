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
  wrongSetContext2,
  wrongSetContext3,
  wrongSetContext4,
  undefinedContext_getApiHttpResponse1,
  undefinedContext_getApiHttpResponse2,

  // The context is the emtpy object `{}`
  emptyContext1,
  emptyContext2,
  emptyContext3,
  emptyContext_getApiHttpResponse,
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
    "Your endpoint function `ctxFunc` is trying to get `this.notExistingContext`, but you didn't define any context";
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
      assert(err.message === "Internal Server Error");
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
    }
  });
  assertStderr(errMsg);

  await stopApp();
}

wrongSetContext2.isIntegrationTest = true;
async function wrongSetContext2(args) {
  const setContext = () => undefined;
  await wrongSetContext({ setContext, ...args });
}
wrongSetContext3.isIntegrationTest = true;
async function wrongSetContext3(args) {
  const setContext = async () => undefined;
  await wrongSetContext({ setContext, ...args });
}
async function wrongSetContext({
  setContext,
  browserEval,
  assertStderr,
  ...args
}) {
  const { stopApp, server } = await createServer({
    setContext,
    ...args,
  });

  /*
   * Cannot call any endpoint
   */

  server.boringEndpoint = function () {};

  const errMsg =
    "Your context function `boringEndpoint` should return a `instanceof Object`.";

  let err;
  try {
    await wildcardClient.endpoints.boringEndpoint();
  } catch (_err) {
    err = _err;
  }
  assert(err.stack.includes(errMsg));

  await browserEval(async () => {
    try {
      await window.server.boringEndpoint();
    } catch (err) {
      assert(err.message === "Internal Server Error");
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
    }
  });
  assertStderr(errMsg);

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

  const ret_serverSide = await wildcardClient.endpoints.ctxEndpoint();
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
    "Your endpoint function `contexti2` is trying to get `this.doesNotExist`, but you didn't define any context"
  );
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
async function wrongSetContext4({ server, wildcardServer }) {
  server.contexti4 = function () {};

  const url = "https://example.org/_wildcard_api/contexti4";
  const method = "POST";
  const context = async () => {
    throw new Error("[TEST-ERROR] User-error in context function");
  };
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr(
    "Your endpoint function `contexti2` is trying to get `this.doesNotExist`, but you didn't define any context"
  );
}
