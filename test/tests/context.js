// Context validation logic:
// - The context can be undefined, but then an error is shown upon any attempt to read the context
// - Context functions are not allowed to return undefined
// The goal being:
// - Browser-side and client-side usage of the Wildcard client should behave identically
// - Show an error when the user forgets to `bind()` while doing SSR
// - Keep things JS-esque and simple

// Use cases:
// - [Server-side] Bind undefined - no context usage [valid]
// - [Server-side] Bind undefined - context usage [invalid]
// - [Server-side] Bind {} - missing context [valid]
// - [Client-side] getApiHttpResponse/wildcard(setContext) undefined - no context usage [valid]
// - [Client-side] getApiHttpResponse/wildcard(setContext) undefined - context usage [invalid]
// - [Client-side] getApiHttpResponse/wildcard(setContext) ()=>(undefined) [invalid]
// - [Client-side] getApiHttpResponse/wildcard(setContext) {}/()=>({}) - missing context [valid]

const { createServer } = require("./details");

module.exports = [
  // ### Context setting
  // `wildcard(async () => context)`
  defineWith_setContext1,
  // `wildcard(() => context)`
  defineWith_setContext2,
  // `wildcard(context)`
  defineWith_setContext3,
  // `bind(context)`
  defineWith_bind,
  // `getApiHttpResponse(_, context)`
  // `getApiHttpResponse(_, async () => context)`
  defineWith_getApiHttpResponse,

  // ### Context is `undefined`
  // [Client-side] `wildcard(undefined)`, not using context: valid
  // [Client-side] `wildcard(undefined)`, using context: invalid
  // [Server-side] No `bind()`, not using context: valid
  // [Server-side] `bind(undefined)`, not using context: valid
  // [Server-side] No `bind()`, using context: invalid
  // [Server-side] `bind(undefined)`, using context: invalid
  undefinedContext,
  // [Client-side] `getApiHttpResponse(_, context)`, `context===undefined`, not using context: valid
  // [Client-side] `getApiHttpResponse(_, context)`, `context===undefined`, using context: invalid
  undefinedContext_getApiHttpResponse,

  // ### Wrong context function
  // [Client-side] `wildcard(() => undefined)`: invalid
  setContextReturnsUndefined1,
  // [Client-side] `wildcard(async () => undefined)`: invalid
  setContextReturnsUndefined2,
  // [Client-side] `getApiHttpResponse(_, () => undefined)`: invalid
  setContextReturnsUndefined_getApiHttpResponse,
  // [Client-side] `wildcard(() => 'string')`, `context === `: invalid
  setContextReturnsWrongValue1,
  // [Client-side] `getApiHttpResponse(_, null)`: invalid
  wrongContext_getApiHttpResponse,
  // [Client-side] `wildcard(() => throw)`
  setContextThrows,
  // [Client-side] `getApiHttpResponse(_, () => throw)`
  setContextThrows_getApiHttpResponse,

  // ### Context is `{}`
  // [Client-side] `wildcard({})`, using missing context: valid
  emptyContext1,
  // [Client-side] `wildcard(() => {})`, using missing context: valid
  emptyContext2,
  // [Client-side] `wildcard(async () => {})`, using missing context: valid
  emptyContext3,
  // [Client-side] `getApiHttpResponse(_, {})`, using missing context: valid
  // [Client-side] `getApiHttpResponse(_, () => ({}))`, using missing context: valid
  emptyContext_getApiHttpResponse,

  // ### Misc
  // `server.someEndpoint = function() { this.newCtx = 'bla' }`: invalid
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
// Directly provide `context`
defineWith_setContext3.isIntegrationTest = true;
async function defineWith_setContext3(args) {
  const setContext = { userId: 4242 };
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

async function defineWith_bind({ server, telefuncClient }) {
  const numbers = [1, 2, 3];
  server.hello = async function (prefix) {
    assert(this.numbers === numbers);
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    return prefix + sum(this.numbers);
  };
  let { hello } = telefuncClient.endpoints;
  hello = hello.bind({ numbers });
  const res = await hello("Total: ");
  assert(res === "Total: 6");
}

undefinedContext.isIntegrationTest = true;
async function undefinedContext({ browserEval, assertStderr, ...args }) {
  const setContext = undefined;

  const { stopApp, server, telefuncClient } = await createServer({
    setContext,
    ...args,
  });

  /*
   * Can call endpoints that don't use the context
   */

  server.contextLessFunc = async function (msg) {
    return "works fine " + msg;
  };

  const ret_serverSide1 = await telefuncClient.endpoints.contextLessFunc("rom");
  assert(ret_serverSide1 === "works fine rom");

  const ret_serverSide2 = await telefuncClient.endpoints.contextLessFunc.bind(
    undefined
  )("brillout");
  assert(ret_serverSide2 === "works fine brillout");

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
    "[Telefunc][Wrong Usage] Wrong usage of the Wildcard client in Node.js. Your endpoint function `ctxFunc` is trying to get `this.notExistingContext`, but you didn't define any context and as a result `this` is `undefined`. Make sure to provide a context by using `bind({notExistingContext})` when calling your `ctxFunc` endpoint in Node.js. More infos at https://github.com/telefunc/telefunc/blob/master/docs/ssr-auth.md";
  let err;
  try {
    await telefuncClient.endpoints.ctxFunc();
  } catch (_err) {
    err = _err;
  }
  assert(err.stack.includes(errMsg));
  try {
    await telefuncClient.endpoints.ctxFunc.bind(undefined)();
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
    "[Telefunc][Wrong Usage] Your endpoint function `ctxFunc` is trying to get `this.notExistingContext`, but you didn't define any context and as a result `this` is `undefined`. Make sure to provide a context with the `setContext` function when using the `wildcard(setContext)` express middleware."
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
  const { stopApp, server } = await createServer({
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
    "Your context function `setContext` should not return `undefined`. If there is no context, then return the empty object `{}`."
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
  const { stopApp, server, telefuncClient } = await createServer({
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

  const ret_serverSide = await telefuncClient.endpoints.ctxEndpoint.bind({})();
  assert(ret_serverSide === "undefined blib");

  await stopApp();
}

async function defineWith_getApiHttpResponse({ server, telefuncServer }) {
  server.square = function () {
    return this.num * this.num;
  };
  const url = "https://example.org/_wildcard_api/square";
  const method = "POST";

  await req({ num: 3 }, "9");
  await req(function () {
    return { num: 4 };
  }, "16");
  await req(async function () {
    return { num: 6 };
  }, "36");
  await req(async () => ({ num: 5 }), "25");
  await req(() => ({ num: 10 }), "100");

  async function req(context, result) {
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method },
      context
    );
    assert(responseProps.statusCode === 200);
    assert(responseProps.body === result);
  }
}
async function setContextReturnsUndefined_getApiHttpResponse({
  server,
  telefuncServer,
  assertStderr,
}) {
  server.boringEndpoint = function () {};
  const url = "https://example.org/_wildcard_api/boringEndpoint";
  const method = "POST";
  const myCtxFunc = async () => undefined;
  const responseProps = await telefuncServer.getApiHttpResponse(
    { url, method },
    myCtxFunc
  );
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr(
    "Your context function `myCtxFunc` should not return `undefined`. If there is no context, then return the empty object `{}`."
  );
}
async function undefinedContext_getApiHttpResponse({
  server,
  telefuncServer,
  assertStderr,
}) {
  server.without_context = function () {
    return " cba";
  };
  server.with_context = function () {
    return this.doesNotExist + " abc";
  };

  {
    const url = "https://example.org/_wildcard_api/without_context/";
    const method = "POST";
    const context = undefined;
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method },
      context
    );
    assert(responseProps.statusCode === 200);
    assert(responseProps.body === `" cba"`);
  }

  {
    const url = "https://example.org/_wildcard_api/with_context";
    const method = "POST";
    const context = undefined;
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method },
      context
    );
    assert(responseProps.statusCode === 500);
    assert(responseProps.body === `Internal Server Error`);
    assertStderr(
      "Error: [Telefunc][Wrong Usage] Your endpoint function `with_context` is trying to get `this.doesNotExist`, but you didn't define any context and as a result `this` is `undefined`. Make sure to provide a context when using `getApiHttpResponse(requestProps, context)`."
    );
  }
}
async function wrongContext_getApiHttpResponse({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_wildcard_api/ummm";
  const method = "GET";

  await req(null);
  await req(123);
  await req("123");

  async function req(context) {
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method },
      context
    );
    assert(responseProps.statusCode === 500);
    assert(responseProps.body === `Internal Server Error`);
    assertStderr(
      "The context cannot be `" +
        context +
        "`. The context should be a `instanceof Object`. If there is no context then use the empty object `{}`."
    );
  }
}
async function emptyContext_getApiHttpResponse({ server, telefuncServer }) {
  server.contexti3 = function () {
    return this.doesNotExist + " abc";
  };
  const url = "https://example.org/_wildcard_api/contexti3";
  const method = "POST";

  await req({});
  await req(() => ({}));
  await req(async () => ({}));
  await req(function () {
    return {};
  });
  await req(async function () {
    return {};
  });

  return;

  async function req(context) {
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method },
      context
    );
    assert(responseProps.statusCode === 200);
    assert(responseProps.body === `"undefined abc"`);
  }
}
async function setContextThrows_getApiHttpResponse({
  server,
  telefuncServer,
  assertStderr,
}) {
  server.contexti4 = function () {};

  const url = "https://example.org/_wildcard_api/contexti4";
  const method = "POST";
  const errMsg = "[TEST-ERROR] User-error in context function";

  await req(() => {
    throw new Error(errMsg);
  });
  await req(async () => {
    throw new Error(errMsg);
  });
  await req(function () {
    throw new Error(errMsg);
  });
  await req(async function () {
    throw new Error(errMsg);
  });

  async function req(context) {
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method },
      context
    );
    assert(responseProps.statusCode === 500);
    assert(responseProps.body === `Internal Server Error`);
    assertStderr(errMsg);
  }
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

setContextThrows.isIntegrationTest = true;
async function setContextThrows({ assertStderr, ...args }) {
  const errText = "[TEST-ERROR] err" + Math.random();
  const setContext = async () => {
    throw new Error(errText);
  };

  await _createAndCallAnEndpoint({ setContext, ...args });

  assertStderr(errText);
}

async function contextImmutable({
  server,
  telefuncClient,
  browserEval,
  assertStderr,
}) {
  server.he = async function () {
    this.nop = 11;
  };
  const errMsg = "The context object cannot be modified.";

  try {
    await telefuncClient.endpoints.he();
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
