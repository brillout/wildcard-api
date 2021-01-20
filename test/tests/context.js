// Context validation logic:
// - The context can be undefined, but then an error is shown upon any attempt to read the context
// - Context functions are not allowed to return undefined
// The goal being:
// - Browser-side and client-side usage of the Telefunc client should behave identically
// - Show an error when the user forgets to `bind()` while doing SSR
// - Keep things JS-esque and simple

// Use cases:
// - [Server-side] Bind undefined - no context usage [valid]
// - [Server-side] Bind undefined - context usage [invalid]
// - [Server-side] Bind {} - missing context [valid]
// - [Client-side] getApiHttpResponse/telefunc(setContext) undefined - no context usage [valid]
// - [Client-side] getApiHttpResponse/telefunc(setContext) undefined - context usage [invalid]
// - [Client-side] getApiHttpResponse/telefunc(setContext) ()=>(undefined) [invalid]
// - [Client-side] getApiHttpResponse/telefunc(setContext) {}/()=>({}) - missing context [valid]

const { createServer } = require("./details");

module.exports = [
  // ### Context setting
  // `telefunc(async () => context)`
  defineWith_setContext1,
  // `telefunc(() => context)`
  defineWith_setContext2,
  // `telefunc(context)`
  defineWith_setContext3,
  // `getApiHttpResponse(_, context)`
  // `getApiHttpResponse(_, async () => context)`
  defineWith_getApiHttpResponse,
  defineWith_addContext,

  // ### Context is `undefined`
  // [Client-side] `telefunc(undefined)`, not using context: valid
  // [Client-side] `telefunc(undefined)`, using context: invalid
  // [Server-side] No `bind()`, not using context: valid
  // [Server-side] `bind(undefined)`, not using context: valid
  // [Server-side] No `bind()`, using context: invalid
  // [Server-side] `bind(undefined)`, using context: invalid
  undefinedContext,
  // [Client-side] `getApiHttpResponse(_, context)`, `context===undefined`, not using context: valid
  // [Client-side] `getApiHttpResponse(_, context)`, `context===undefined`, using context: invalid
  undefinedContext_getApiHttpResponse,

  // ### Wrong context function
  // [Client-side] `telefunc(() => undefined)`: invalid
  setContextReturnsUndefined1,
  // [Client-side] `telefunc(async () => undefined)`: invalid
  setContextReturnsUndefined2,
  // [Client-side] `getApiHttpResponse(_, () => undefined)`: invalid
  setContextReturnsUndefined_getApiHttpResponse,
  // [Client-side] `telefunc(() => 'string')`, `context === `: invalid
  setContextReturnsWrongValue1,
  // [Client-side] `getApiHttpResponse(_, null)`: invalid
  wrongContext_getApiHttpResponse,
  // [Client-side] `telefunc(() => throw)`
  setContextThrows,
  // [Client-side] `getApiHttpResponse(_, () => throw)`
  setContextThrows_getApiHttpResponse,

  // ### Context is `{}`
  // [Client-side] `telefunc({})`, using missing context: valid
  emptyContext1,
  // [Client-side] `telefunc(() => {})`, using missing context: valid
  emptyContext2,
  // [Client-side] `telefunc(async () => {})`, using missing context: valid
  emptyContext3,
  // [Client-side] `getApiHttpResponse(_, {})`, using missing context: valid
  // [Client-side] `getApiHttpResponse(_, () => ({}))`, using missing context: valid
  emptyContext_getApiHttpResponse,

  // ### Wrong Usages
  missingSecretKey_getContext_with_telefuncCookie,
  missingSecretKey,
  contextChange_withoutBrowser,
  bindIsDeprecated,
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

  server.myTelefunction = async function () {
    return this.userId + "yep";
  };

  await browserEval(async () => {
    const ret = await window.telefunc.server.myTelefunction();
    assert(ret === "4242yep");
  });

  await stopApp();
}

undefinedContext.isIntegrationTest = true;
async function undefinedContext({ browserEval, assertStderr, ...args }) {
  const setContext = undefined;

  const { stopApp, server, telefuncClient } = await createServer({
    setContext,
    ...args,
  });

  /*
   * Can call telefunctions that don't use context
   */

  server.contextLessFunc = async function (msg) {
    return "works fine " + msg;
  };

  const ret_serverSide1 = await telefuncClient.telefunctions.contextLessFunc(
    "rom"
  );
  assert(ret_serverSide1 === "works fine rom");

  await browserEval(async () => {
    const ret_browserSide = await window.telefunc.server.contextLessFunc(
      "romi"
    );
    assert(ret_browserSide === "works fine romi");
  });

  /*
   * Can call telefunctions that do use context
   */

  server.ctxFunc = async function () {
    return this.notExistingContext + " blib";
  };

  await telefuncClient.telefunctions.ctxFunc();

  await browserEval(async () => {
    await window.telefunc.server.ctxFunc();
  });

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
   * Cannot call any telefunction
   */

  server.boringTelefunction = function () {};

  await browserEval(async () => {
    try {
      await window.telefunc.server.boringTelefunction();
    } catch (err) {
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
      assert(
        err.message === "Telefunction `boringTelefunction` threw an error."
      );
    }
  });
  assertStderr(
    "[Telefunc][Wrong Usage] The `context` returned by your context function `setContext` is not allowed to be `undefined`; it should be a `context.constructor===Object` instead; if there is no context then use the empty object `{}`."
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
  const { stopApp, server } = await createServer({
    setContext,
    ...args,
  });

  server.ctxTelefunction = async function () {
    return this.notExistingContext + " blib";
  };

  await browserEval(async () => {
    const ret_browserSide = await window.telefunc.server.ctxTelefunction();
    assert(ret_browserSide === "undefined blib");
  });

  await stopApp();
}

async function defineWith_getApiHttpResponse({ server, telefuncServer }) {
  server.square = function () {
    return this.num * this.num;
  };
  const url = "https://example.org/_telefunc/square";
  const method = "POST";
  const headers = {};

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
      { url, method, headers },
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
  server.boringTelefunction = function () {};
  const url = "https://example.org/_telefunc/boringTelefunction";
  const method = "POST";
  const headers = {};
  const myCtxFunc = async () => undefined;
  const responseProps = await telefuncServer.getApiHttpResponse(
    { url, method, headers },
    myCtxFunc
  );
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr(
    "[Telefunc][Wrong Usage] The `context` returned by your context function `myCtxFunc` is not allowed to be `undefined`; it should be a `context.constructor===Object` instead; if there is no context then use the empty object `{}`."
  );
}
async function undefinedContext_getApiHttpResponse({ server, telefuncServer }) {
  server.without_context = function () {
    return " cba";
  };
  server.with_context = function () {
    return this.doesNotExist + " abc";
  };

  {
    const url = "https://example.org/_telefunc/without_context/";
    const method = "POST";
    const headers = {};
    const context = undefined;
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method, headers },
      context
    );
    assert(responseProps.statusCode === 200);
    assert(responseProps.body === `" cba"`);
  }

  {
    const url = "https://example.org/_telefunc/with_context";
    const method = "POST";
    const headers = {};
    const context = undefined;
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method, headers },
      context
    );
    assert(responseProps.statusCode === 200);
    assert(responseProps.body === `"undefined abc"`);
  }
}
async function wrongContext_getApiHttpResponse({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_telefunc/ummm";
  const method = "GET";
  const headers = {};

  await req(null);
  await req(123);
  await req("123");

  async function req(context) {
    const responseProps = await telefuncServer.getApiHttpResponse(
      { url, method, headers },
      context
    );
    assert(responseProps.statusCode === 500);
    assert(responseProps.body === `Internal Server Error`);
    assertStderr(
      "[Telefunc][Wrong Usage] The `context` provided by `getApiHttpResponse(requestProps, context)` is not allowed to be `" +
        context +
        "`; it should be a `context.constructor===Object` instead; if there is no context then use the empty object `{}`."
    );
  }
}
async function emptyContext_getApiHttpResponse({ server, telefuncServer }) {
  server.contexti3 = function () {
    return this.doesNotExist + " abc";
  };
  const url = "https://example.org/_telefunc/contexti3";
  const method = "POST";
  const headers = {};

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
      { url, method, headers },
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

  const url = "https://example.org/_telefunc/contexti4";
  const method = "POST";
  const headers = {};
  const errMsg = "[EXPECTED_ERROR] User-error in context function";

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
      { url, method, headers },
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

  await _createAndCallATelefunction({ setContext, ...args });

  assertStderr(
    "[Telefunc][Wrong Usage] The `context` returned by your context function `setContext` is not allowed to be `wrong-context-type`; it should be a `context.constructor===Object` instead; if there is no context then use the empty object `{}`."
  );
}
async function _createAndCallATelefunction({
  setContext,
  browserEval,
  ...args
}) {
  const { stopApp, server } = await createServer({
    setContext,
    ...args,
  });

  let telefunctionCalled = false;
  server.failingTelefunction = async function (name) {
    telefunctionCalled = true;
    return "Dear " + name;
  };

  await browserEval(async () => {
    let err;
    try {
      await window.telefunc.server.failingTelefunction("rom");
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
    assert(
      err.message === "Telefunction `failingTelefunction` threw an error."
    );
  });

  assert(telefunctionCalled === false);

  await stopApp();
}

setContextThrows.isIntegrationTest = true;
async function setContextThrows({ assertStderr, ...args }) {
  const errText = "[EXPECTED_ERROR] err" + Math.random();
  const setContext = async () => {
    throw new Error(errText);
  };

  await _createAndCallATelefunction({ setContext, ...args });

  assertStderr(errText);
}

async function missingSecretKey_getContext_with_telefuncCookie({
  telefuncServer,
  server,
  context,
  assertStderr,
}) {
  server.withContextChange = function () {
    context.isLoggedIn;
  };

  const url = "https://example.org/_telefunc/withContextChange";
  const method = "POST";
  const cookie =
    "Cookie: telefunc-signature_loggedUser=aa0ebbd05370f26f2951b6d3cbcfdc18501d376b7e0b7f9a5a78a20903d895cb; telefunc_loggedUser=%7B%22userId%22%3A%22user_BPNmc82b7iE%22%2C%22userEmail%22%3A%22lsos%40brillout.com%22%7D; telefunc_isLoggedIn=true; telefunc-signature_isLoggedIn=c1b6109b74688be0fedc1374fd1f064aaaeefcc3374e9a856536c4c995283396";
  const headers = { cookie };

  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method,
    headers,
  });
  assert(responseProps.statusCode === 500);
  assert(responseProps.body === `Internal Server Error`);
  assertStderr(
    "[Telefunc][Wrong Usage] You are trying to access the `context.isLoggedIn` which does exist in a Telefunc Cookie, but `setSecretKey()` has not been called yet. Make sure to call `setSecretKey()` *before* you try to access `context.isLoggedIn`."
  );
}

async function missingSecretKey({
  server,
  telefuncClient,
  browserEval,
  assertStderr,
}) {
  server.he = async function () {
    this.nop = 11;
  };

  const missingKeyErrorMessage =
    "[Telefunc][Wrong Usage] You are trying to change the context `context.nop`, but context can be modified only after `setSecretKey()` has been called. Make sure you call `setSecretKey()` before modifying the context.";

  try {
    await telefuncClient.telefunctions.he();
  } catch (err) {
    assert(err.message === missingKeyErrorMessage);
  }

  await browserEval(async () => {
    try {
      await window.telefunc.server.he();
    } catch (err) {
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
      assert(err.message === "Telefunction `he` threw an error.");
    }
  });

  assertStderr(missingKeyErrorMessage);
}

async function contextChange_withoutBrowser({
  server,
  telefuncClient,
  setSecretKey,
}) {
  setSecretKey("uihewqiehqiuehuaheliuhawiulehqchbas");

  server.he = async function () {
    this.nop = 11;
  };

  try {
    await telefuncClient.telefunctions.he();
  } catch (err) {
    console.log(err.message);
    assert(
      err.message ===
        //  "[Telefunc][Wrong Usage] The context object can only be modified when running the Telefunc client in the browser, but you are using the Telefunc client on the server-side in Node.js."
        "bla"
    );
  }
}

defineWith_addContext.isIntegrationTest = true;
async function defineWith_addContext({ browserEval, ...args }) {
  const {
    stopApp,
    server,
    app,
    telefuncServer: { setSecretKey, addContext, context },
  } = await createServer(args);

  setSecretKey("u912u98haaewoi");

  app.use((req, _, next) => {
    {
      let err;
      try {
        addContext([]);
      } catch (_err) {
        err = _err;
      }
      assert.strictEqual(
        err.message,
        "[Telefunc][Wrong Usage] The `context` provided by `addContext(context)` is not allowed to be a `context.constructor===Array`; it should be a `context.constructor===Object` instead."
      );
    }
    console.log("h", req.headers);
    addContext(req.headers);
    next();
  });

  server.getHeader = async function () {
    console.log(context.headers);
    assert(context.headers["eqwuhu"] === "euiqh");
  };

  await browserEval(async () => {
    const ret = await window.telefunc.server.getHeader();
    assert(ret === "4242yep");
  });

  await stopApp();
}

async function bindIsDeprecated({ server, telefuncClient }) {
  server.someTelFct = function () {};
  let err;
  try {
    await telefuncClient.telefunctions.someTelFct.bind({})();
  } catch (_err) {
    err = _err;
  }
  assert.strictEqual(
    err.message,
    "[Telefunc][Wrong Usage] Binding the context object with `bind()` is deprecated."
  );
}
