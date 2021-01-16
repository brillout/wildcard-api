module.exports = [bigPayloads, noConnection];

async function bigPayloads({ server, browserEval }) {
  const _bigArg = gen_big_string();
  const _bigResult = gen_big_string();

  server.bigEndpoint = async function ({ bigArg }) {
    assert(bigArg === _bigArg);
    return _bigResult;
  };

  await browserEval(
    async ({ _bigArg, _bigResult }) => {
      const bigResult = await window.telefunc.server.bigEndpoint({
        bigArg: _bigArg,
      });
      assert(bigResult === _bigResult);
    },
    { browserArgs: { _bigResult, _bigArg } }
  );
}

function gen_big_string() {
  let str = "";
  for (let i = 0; i < 10 * 10000; i++) {
    const char = Math.round(Math.random() * 10).toString()[0];
    str += char;
  }
  return str;
}

async function noConnection({ server, browserEval, assertStderr }) {
  server.unreachableEndpoint = async function () {
    assert(false);
  };

  await browserEval(
    async () => {
      let err;
      try {
        await window.telefunc.server.unreachableEndpoint();
      } catch (err_) {
        err = err_;
      }
      assert(err.isConnectionError === true);
      assert(err.isCodeError === false);
      assert(err.message === "No Server Connection");
    },
    { offlineMode: true }
  );
  assertStderr(null);
}
