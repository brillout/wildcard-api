module.exports = [endpointBug, noConnection, endpointDoesntExist];

async function endpointBug({ server, browserEval }) {
  server.buggyEndpoint1 = async function () {
    throw new Error("This is a simulated bug");
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
  assertStderr('This is a simulated bug');
}

async function noConnection({ server, browserEval }) {
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
      assert(err.isCodeError === null);
      assert(err.message === "No Server Connection");
    },
    { offlineMode }
  );
  assertStderr(null);
}

function endpointDoesntExist({ browserEval, assertStderr }) {
  await browserEval(async () => {
    let err;
    try {
      await window.server.iDoNotExist({ some: 42, arg: "rom" });
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError === true);
    assert(err.isConnectionError === false);
    assert(err.message === 'Endpoint `iDoNotExist` does not exist.');
  });
  assertStderr(null);
}
