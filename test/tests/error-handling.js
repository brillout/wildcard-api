module.exports = [
  endpointBug,
  noConnection,
  endpointMissing,
  endpointMissing_SSR,
];

async function endpointBug({ server, browserEval, assertStderr }) {
  server.buggyEndpoint1 = async function () {
    throw new Error("[EXPECTED_ERROR] This is a simulated bug");
    // @ts-ignore
    return "You shouldn't see me";
  };

  await browserEval(async () => {
    let err;
    try {
      await server.buggyEndpoint1();
    } catch (err_) {
      err = err_;
    }
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
    assert(
      err.message === "Endpoint function `buggyEndpoint1` threw an error."
    );
  });
  assertStderr("[EXPECTED_ERROR] This is a simulated bug");
}

async function noConnection({ server, browserEval, assertStderr }) {
  const offlineMode = true;

  server.unreachableEndpoint = async function () {
    return "You shouldn't see me";
  };

  await browserEval(
    async () => {
      let err;
      try {
        await server.unreachableEndpoint();
      } catch (err_) {
        err = err_;
      }
      assert(err.isConnectionError === true);
      assert(err.isCodeError === false);
      assert(err.message === "No Server Connection");
    },
    { offlineMode }
  );
  assertStderr(null);
}

async function endpointMissing({ browserEval, assertStderr }) {
  await browserEval(async () => {
    let err;
    try {
      await window.server.iDoNotExist({ some: 42, arg: "rom" });
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
    assert(err.message === "Endpoint `iDoNotExist` does not exist.");
  });
  assertStderr(null);
}

async function endpointMissing_SSR({ telefuncClient, assertStderr }) {
  let errStack;
  try {
    await telefuncClient.endpoints.missingEndpoint();
  } catch (err) {
    errStack = err.stack;
  }
  assert(errStack.includes("Endpoint `missingEndpoint` doesn't exist."));
  assert(errStack.includes("You didn't define any endpoints."));
  assertStderr(null);
}
