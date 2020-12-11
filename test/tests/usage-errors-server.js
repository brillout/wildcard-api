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

module.exports.setProd = setProd;
module.exports.unsetProd = unsetProd;

async function endpointMissing_noEndpoints_serverSide({
  telefuncClient,
  assertStderr,
}) {
  let err;
  try {
    await telefuncClient.endpoints.iAmNotHere();
  } catch (_err) {
    err = _err;
  }

  assert(
    err.message ===
      "[Telefunc][Wrong Usage] Endpoint `iAmNotHere` does not exist. You didn't define any endpoint. Make sure that your file that defines `iAmNotHere` is named `endpoints.js` or ends with `.endpoints.js` and Telefunc will automatically load it. For TypeScript `endpoints.ts` and `*.endpoints.ts` works as well. Alternatively, manually load your file with `require`/`import`."
  );
  // Don't show: Loaded endpoints: ...
  assert(!err.stack.includes("Loaded endpoints"));
  // Don't show: (This error is not shown in production.)
  assert(!err.stack.includes("shown in production"));

  assertStderr(null);
}
async function endpointMissing_noEndpoints_clientSide({
  browserEval,
  assertStderr,
}) {
  const callTelefunc = () =>
    browserEval(async () => {
      let err;
      try {
        await window.server.iDoNotExist({ some: 42, arg: "rom" });
      } catch (_err) {
        err = _err;
      }
      assert(
        err.message ===
          "Endpoint `iDoNotExist` does not exist. Check the server-side error for more information."
      );
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
    });

  setProd();
  await callTelefunc();
  unsetProd();
  assertStderr(
    "[Telefunc][Wrong Usage] Endpoint `iDoNotExist` does not exist. You didn't define any endpoint. Make sure that your file that defines `iDoNotExist` is named `endpoints.js` or ends with `.endpoints.js` and Telefunc will automatically load it. For TypeScript `endpoints.ts` and `*.endpoints.ts` works as well. Alternatively, manually load your file with `require`/`import`."
  );
}
async function endpointMissing_notDefined_clientSide({
  server,
  browserEval,
  assertStderr,
}) {
  server.neverCalledEndpoint = async function () {};
  server.emptyEndpoint = async function () {};

  const callTelefunc = () =>
    browserEval(async () => {
      let err;
      try {
        await window.server.iDoNotExist({ some: 42, arg: "rom" });
      } catch (_err) {
        err = _err;
      }
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
      assert(
        err.message ===
          "Endpoint `iDoNotExist` does not exist. Check the server-side error for more information."
      );
    });

  setProd();
  await callTelefunc();
  unsetProd();
  // In production, we don't throw any error on the server-side to
  // avoid flooding of server error logs.
  assertStderr(null);

  await callTelefunc();

  assertStderr(
    "[Telefunc][Wrong Usage] Endpoint `iDoNotExist` does not exist. Make sure that your file that defines `iDoNotExist` is named `endpoints.js` or ends with `.endpoints.js` and Telefunc will automatically load it. For TypeScript `endpoints.ts` and `*.endpoints.ts` works as well. Alternatively, manually load your file with `require`/`import`. Loaded endpoints: `neverCalledEndpoint`, `emptyEndpoint`. (This error is not shown in production.)"
  );
}
async function endpointMissing_notDefined_serverSide({
  server,
  telefuncClient,
  assertStderr,
}) {
  server.notUsed = async function () {};

  let err;
  try {
    await telefuncClient.endpoints.missingEndpoint();
  } catch (_err) {
    err = _err;
  }

  // Unlike on the browser-side, when using the telefunc client
  // on the server-side we do always throw an error.
  setProd();

  assert(
    err.message ===
      "[Telefunc][Wrong Usage] Endpoint `missingEndpoint` does not exist. Make sure that your file that defines `missingEndpoint` is named `endpoints.js` or ends with `.endpoints.js` and Telefunc will automatically load it. For TypeScript `endpoints.ts` and `*.endpoints.ts` works as well. Alternatively, manually load your file with `require`/`import`. Loaded endpoints: `notUsed`. (This error is not shown in production.)"
  );

  assert(!err.stack.includes("You didn't define any endpoints."));

  assertStderr(null);

  unsetProd();
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

function setProd() {
  assert(process.env.NODE_ENV === undefined);
  process.env.NODE_ENV = "production";
}
function unsetProd() {
  assert(process.env.NODE_ENV === "production");
  delete process.env.NODE_ENV;
  assert(process.env.NODE_ENV === undefined);
}
