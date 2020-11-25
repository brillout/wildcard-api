const { createServer } = require("./details");

module.exports = [
  endpointMissing_noEndpoints_serverSide,
  endpointMissing_noEndpoints_clientSide,
  endpointMissing_notDefined_clientSide,
  endpointMissing_notDefined_serverSide,

  endpointThrowsError,
  endpointReturnsUnserializable,

  wrongUsage_getApiHttpResponse_1,
  wrongUsage_getApiHttpResponse_2,
  wrongUsage_getApiHttpResponse_3,
  wrongUsage_getApiHttpResponse_4,

  wrongEndpointFunction,
];

async function endpointMissing_noEndpoints_serverSide({
  telefuncClient,
  assertStderr,
}) {
  let err;
  try {
    await telefuncClient.endpoints.helloSsr();
  } catch (_err) {
    err = _err;
  }

  // Contrary to when using the Wilcard Client on the browser-side,
  // we do throw an error on the server-side when
  // using theTelefunc Client on the server-side
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
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
  });

  // We don't throw any error on the server-side
  // Since the bug lives in browser-side code
  // To avoid malintentioned flooding of server error logs
  assertStderr(null);
}
async function endpointMissing_notDefined_clientSide({
  server,
  browserEval,
  assertStderr,
}) {
  server.servus = async function ({ name: { oe } }) {
    return "Bonjour " + oe;
  };

  await browserEval(async () => {
    let err;
    try {
      await window.server.iDoNotExist();
    } catch (_err) {
      err = _err;
    }
    assert(err.message === "Endpoint `iDoNotExist` does not exist.");
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
  });

  assertStderr(null);
}
async function endpointMissing_notDefined_serverSide({
  server,
  telefuncClient,
  assertStderr,
}) {
  server.servus = async function (oe) {
    return "Bonjour " + oe;
  };

  let err;
  try {
    await telefuncClient.endpoints.helloSsr();
  } catch (_err) {
    err = _err;
  }

  assert(err.stack.includes("Endpoint `helloSsr` doesn't exist."));
  assert(!err.stack.includes("You didn't define any endpoints."));
  assert(!err.stack.includes("servus"));
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
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
    assert(err.message === "Endpoint function `fnEndpoint1` threw an error.");
  });

  assertStderr("Couldn't serialize value returned by endpoint `fnEndpoint1`");
}

async function endpointThrowsError({ server, browserEval, assertStderr }) {
  const errorText = "[EXPECTED_ERROR] oh-oh-error" + Math.random();

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
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
    assert(err.message === "Endpoint function `aintWorking` threw an error.");
  });

  assertStderr(errorText);
}

async function wrongUsage_getApiHttpResponse_1({
  telefuncServer,
  assertStderr,
}) {
  const responseProps = await telefuncServer.getApiHttpResponse();
  assertErrorResponse(responseProps);
  assertStderr("Missing arguments `url` and `method`");
}
async function wrongUsage_getApiHttpResponse_2({
  telefuncServer,
  assertStderr,
}) {
  const responseProps = await telefuncServer.getApiHttpResponse({
    method: "post",
  });
  assertErrorResponse(responseProps);
  assertStderr("Missing argument `url`");
}
async function wrongUsage_getApiHttpResponse_3({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_telefunc/ummm";
  const responseProps = await telefuncServer.getApiHttpResponse({ url });
  assertErrorResponse(responseProps);
  assertStderr("Missing argument `method`");
}
async function wrongUsage_getApiHttpResponse_4({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_telefunc/ummm";
  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method: "",
  });
  assertErrorResponse(responseProps);
  assertStderr("Missing argument `method`");
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
    server.arrowFunc2 = () => {};
  } catch (err) {
    assert(
      err.stack.includes(
        "The endpoint function `arrowFunc2` is an arrow function."
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
