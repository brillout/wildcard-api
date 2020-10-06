module.exports = [bindUsage];

async function bindUsage({ server, browserEval, assertStderr }) {
  server.ohNo = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    try {
      await server.ohNo.bind({ some: "context" })();
    } catch (err) {
      throw err;
    }
  });

  assertStderr(
    "Using `bind` to provide the context object is forbidden on the browser-side."
  );
}
