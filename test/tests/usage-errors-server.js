const { createServer } = require("./details");

module.exports = [
  endpointMissing_noEndpoints_serverSide,
  endpointMissing_noEndpoints_clientSide,

  endpointThrowsError,
  endpointReturnsUnserializable,

  missingContextSSR,
  wrongContextObject,
  contextGetterThrowsError,

  wrongUsage_getApiHttpResponse_1,
  wrongUsage_getApiHttpResponse_2,
  wrongUsage_getApiHttpResponse_3,
  wrongUsage_getApiHttpResponse_4,
  wrongUsage_getApiHttpResponse_5,

  wrongEndpointFunction,

  unknownConfigSever,
];

async function endpointMissing_noEndpoints_serverSide({
  wildcardClient,
  assertStderr,
}) {
  let err;
  try {
    await wildcardClient.endpoints.helloSsr();
  } catch (_err) {
    err = _err;
  }

  // Contrary to when using the Wilcard Client on the browser-side,
  // we do throw an error on the server-side when
  // using theWildcard Client on the server-side
  assert(err.stack.includes("Endpoint `helloSsr` doesn't exist."));
  assert(err.stack.includes("You didn't define any endpoints."));

  // No collected stderr because we catched the error
  assertStderr(null);
}

async function endpointMissing_noEndpoints_clientSide({
  browserEval,
  assertStderr,
}) {
  await browserEval(async () => {
    let err;
    try {
      await window.server.iDoNotExist({ some: 42, arg: "rom" });
    } catch (_err) {
      err = _err;
    }
    assert(err.message === "Endpoint `iDoNotExist` does not exist.");
    assert(err.isCodeError);
  });

  // We don't throw any error on the server-side
  // Since the bug lives in browser-side code
  // To avoid malintentioned flooding of server error logs
  assertStderr(null);
}

async function endpointReturnsUnserializable({
  server,
  browserEval,
  assertStderr,
}) {
  server.fnEndpoint1 = async function () {
    return function heloFn() {};
  };

  await browserEval(async () => {
    let err;
    try {
      await server.fnEndpoint1();
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError);
    assert(err.message === "Endpoint function `fnEndpoint1` threw an error.");
  });

  assertStderr("Couldn't serialize value returned by endpoint `fnEndpoint1`");
}

async function endpointThrowsError({ server, browserEval, assertStderr }) {
  const errorText = "oh-oh-error" + Math.random();

  server.aintWorking = async function () {
    throw new Error(errorText);
  };

  await browserEval(async () => {
    let err;
    try {
      await server.aintWorking();
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError);
    assert(err.message === "Endpoint function `aintWorking` threw an error.");
  });

  assertStderr(errorText);
}

async function wrongUsage_getApiHttpResponse_1({
  wildcardServer,
  assertStderr,
}) {
  const responseProps = await wildcardServer.getApiHttpResponse();
  assertErrorResponse(responseProps);
  assertStderr("Missing arguments `url` and `method`");
}
async function wrongUsage_getApiHttpResponse_2({
  wildcardServer,
  assertStderr,
}) {
  const responseProps = await wildcardServer.getApiHttpResponse({
    method: "post",
  });
  assertErrorResponse(responseProps);
  assertStderr("Missing argument `url`");
}
async function wrongUsage_getApiHttpResponse_3({
  wildcardServer,
  assertStderr,
}) {
  const url = "https://example.org/_wildcard_api/ummm";
  const responseProps = await wildcardServer.getApiHttpResponse({ url });
  assertErrorResponse(responseProps);
  assertStderr("Missing argument `method`");
}
async function wrongUsage_getApiHttpResponse_4({
  wildcardServer,
  assertStderr,
}) {
  const url = "https://example.org/_wildcard_api/ummm";
  const method = "PUT";
  const responseProps = await wildcardServer.getApiHttpResponse({
    url,
    method,
  });
  assertErrorResponse(responseProps);
  assertStderr('method must be one of ["POST", "GET", "post", "get"]');
}
async function wrongUsage_getApiHttpResponse_5({
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
  assertErrorResponse(responseProps);
  assertStderr(
    "The context object should be a `instanceof Object` or `undefined`."
  );
}
function assertErrorResponse(responseProps) {
  assert(responseProps.body === "Internal Server Error");
  assert(responseProps.statusCode === 500);
  assert(responseProps.contentType === "text/plain");
  assert(Object.keys(responseProps).length === 3);
}

async function wrongEndpointFunction({ server }) {
  try {
    server.arrowFunc = async () => {};
  } catch (err) {
    assert(
      err.stack.includes(
        "The endpoint function `arrowFunc` is an arrow function."
      )
    );
  }

  try {
    server.undi = undefined;
  } catch (err) {
    assert(
      err.message.includes(
        "An endpoint must be a function, but the endpoint `undi` is `undefined`"
      )
    );
  }

  try {
    server.nulli = null;
  } catch (err) {
    assert(
      err.message.includes(
        "An endpoint must be a function, but the endpoint `nulli` is `null`"
      )
    );
  }

  try {
    server.stringi = "bubbabi";
  } catch (err) {
    assert(
      err.message.includes(
        "An endpoint must be a function, but the endpoint `stringi` is a `String`"
      )
    );
  }
}

async function unknownConfigSever({ wildcardServer }) {
  try {
    wildcardServer.config.bliblab = undefined;
  } catch (err) {
    assert(err.message.includes("Unkown config `bliblab`"));
  }
}

async function missingContextSSR({ server, wildcardClient }) {
  let endpointFunctionCalled = false;
  server.ssrTest = async function () {
    let errorThrown = false;
    try {
      this.headers;
    } catch (err) {
      errorThrown = true;
      assert(err);
      assert(
        err.stack.includes(
          "Cannot get `this.headers` because you didn't provide `headers`."
        )
      );
      assert(
        err.stack.includes(
          "Make sure to provide `headers` by using `bind({headers})` when calling your `ssrTest` endpoint in Node.js"
        )
      );
    }
    assert(errorThrown === true);
    endpointFunctionCalled = true;
  };

  await wildcardClient.endpoints.ssrTest();
  assert(endpointFunctionCalled === true);
}

wrongContextObject.isIntegrationTest = true;
async function wrongContextObject({ assertStderr, ...args }) {
  const setContext = () => "wrong-context-type";

  await _createAndCallAnEndpoint({ setContext, ...args });

  assertStderr(
    "The context object should be a `instanceof Object` or `undefined`."
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

contextGetterThrowsError.isIntegrationTest = true;
async function contextGetterThrowsError({ assertStderr, ...args }) {
  const errText = "err" + Math.random();
  const setContext = async () => {
    throw new Error(errText);
  };

  await _createAndCallAnEndpoint({ setContext, ...args });

  assertStderr(errText);
}
