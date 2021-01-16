module.exports = [
  endpointMissing_noTelefunctions_serverSide,
  endpointMissing_noTelefunctions_clientSide,
  endpointMissing_notDefined_clientSide,
  endpointMissing_notDefined_serverSide,

  endpointThrowsError,
  endpointReturnsUnserializable,

  wrongUsage_getApiHttpResponse_1,
  wrongUsage_getApiHttpResponse_2,
  wrongUsage_getApiHttpResponse_3,
  wrongUsage_getApiHttpResponse_missingHeaders,
  wrongUsage_getApiHttpResponse_wrongHeaders,
  wrongUsage_getApiHttpResponse_4,

  wrongTelefunction,
];

module.exports.setProd = setProd;
module.exports.unsetProd = unsetProd;

async function endpointMissing_noTelefunctions_serverSide({
  telefuncClient,
  assertStderr,
}) {
  let err;
  try {
    await telefuncClient.endpoints.iAmNotHere();
  } catch (_err) {
    err = _err;
  }

  assert.strictEqual(
    err.message,
    "[Telefunc][Wrong Usage] Telefunction `iAmNotHere` does not exist. You didn't define any telefunction. Make sure that the name of your file that defines `iAmNotHere` ends with `.telefunc.js`/`.telefunc.ts` (and Telefunc will automatically load it), or manually load your file with `require`/`import`."
  );
  // Don't show: Loaded telefunctions: ...
  assert(!err.stack.includes("Loaded telefunctions"));
  // Don't show: (This error is not shown in production.)
  assert(!err.stack.includes("shown in production"));

  assertStderr(null);
}
async function endpointMissing_noTelefunctions_clientSide({
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
          "Telefunction `iDoNotExist` does not exist. Check the server-side error for more information."
      );
      assert(err.isCodeError === true);
      assert(err.isConnectionError === false);
    });

  setProd();
  await callTelefunc();
  unsetProd();
  assertStderr(
    "[Telefunc][Wrong Usage] Telefunction `iDoNotExist` does not exist. You didn't define any telefunction. Make sure that the name of your file that defines `iDoNotExist` ends with `.telefunc.js`/`.telefunc.ts` (and Telefunc will automatically load it), or manually load your file with `require`/`import`."
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
          "Telefunction `iDoNotExist` does not exist. Check the server-side error for more information."
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
    "[Telefunc][Wrong Usage] Telefunction `iDoNotExist` does not exist. Make sure that the name of your file that defines `iDoNotExist` ends with `.telefunc.js`/`.telefunc.ts` (and Telefunc will automatically load it), or manually load your file with `require`/`import`."
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

  assert.strictEqual(
    err.message,
    "[Telefunc][Wrong Usage] Telefunction `missingEndpoint` does not exist. Make sure that the name of your file that defines `missingEndpoint` ends with `.telefunc.js`/`.telefunc.ts` (and Telefunc will automatically load it), or manually load your file with `require`/`import`. Loaded telefunctions: `notUsed`. (This error is not shown in production.)"
  );

  assert(!err.stack.includes("You didn't define any telefunction."));

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
    assert(err.message === "Telefunction `fnEndpoint1` threw an error.");
  });

  assertStderr(
    "Couldn't serialize value returned by telefunction `fnEndpoint1`"
  );
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
    assert(err.message === "Telefunction `aintWorking` threw an error.");
  });

  assertStderr(errorText);
}

async function wrongUsage_getApiHttpResponse_1({
  telefuncServer,
  assertStderr,
}) {
  const responseProps = await telefuncServer.getApiHttpResponse();
  assertErrorResponse(responseProps);
  assertStderr("missing arguments `url` and `method` and `headers`");
}
async function wrongUsage_getApiHttpResponse_2({
  telefuncServer,
  assertStderr,
}) {
  const responseProps = await telefuncServer.getApiHttpResponse({
    method: "post",
  });
  assertErrorResponse(responseProps);
  assertStderr("missing arguments `url` and `headers`");
}
async function wrongUsage_getApiHttpResponse_3({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_telefunc/ummm";
  const responseProps = await telefuncServer.getApiHttpResponse({ url });
  assertErrorResponse(responseProps);
  assertStderr("missing arguments `method` and `headers`");
}
async function wrongUsage_getApiHttpResponse_missingHeaders({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_telefunc/ummm";
  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method: "POST",
  });
  assertErrorResponse(responseProps);
  assertStderr("missing argument `headers`");
}
async function wrongUsage_getApiHttpResponse_wrongHeaders({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_telefunc/ummm";
  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method: "post",
    headers: [],
  });
  assertErrorResponse(responseProps);
  assertStderr(
    "[Wrong Usage] `getApiHttpResponse()`: argument `headers` should be a `instanceof Object`"
  );
}
async function wrongUsage_getApiHttpResponse_4({
  telefuncServer,
  assertStderr,
}) {
  const url = "https://example.org/_telefunc/ummm";
  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method: "",
    headers: {},
  });
  assertErrorResponse(responseProps);
  assertStderr("missing argument `method`");
}
function assertErrorResponse(responseProps) {
  assert(responseProps.body === "Internal Server Error");
  assert(responseProps.statusCode === 500);
  assert(responseProps.contentType === "text/plain");
  assert(Object.keys(responseProps).length === 3);
}

async function wrongTelefunction({ server }) {
  try {
    server.arrowFunc = async () => {};
  } catch (err) {
    assert(
      err.stack.includes("The telefunction `arrowFunc` is an arrow function.")
    );
  }

  try {
    server.arrowFunc2 = () => {};
  } catch (err) {
    assert(
      err.stack.includes("The telefunction `arrowFunc2` is an arrow function.")
    );
  }

  try {
    server.undi = undefined;
  } catch (err) {
    assert(
      err.message.includes(
        "A telefunction must be a function, but the telefunction `undi` is `undefined`"
      )
    );
  }

  try {
    server.nulli = null;
  } catch (err) {
    assert(
      err.message.includes(
        "A telefunction must be a function, but the telefunction `nulli` is `null`"
      )
    );
  }

  try {
    server.stringi = "bubbabi";
  } catch (err) {
    assert(
      err.message.includes(
        "A telefunction must be a function, but the telefunction `stringi` is a `String`"
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
