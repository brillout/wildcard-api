module.exports = [
  wrongBindUsage1,
  wrongBindUsage2,
  endpointManipulationWithClient,
  cannotSerialize,
  wrongServerUrl,
  unknownConfigServer,
  missingServerUrl,
];

async function wrongBindUsage1({ server, browserEval, assertStderr }) {
  server.ohNo = async function () {};

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

async function wrongBindUsage2({ server, wildcardClient, assertStderr }) {
  server.hm = async function () {};

  try {
    wildcardClient.endpoints.hm.bind(null)();
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "The context object you `bind()` should be a `instanceof Object`."
  );
}

async function endpointManipulationWithClient({
  wildcardClient,
  assertStderr,
}) {
  try {
    wildcardClient.endpoints.thatWontHappen = async function () {};
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "You cannot add/modify endpoint functions with the Wildcard client"
  );
}

async function cannotSerialize({ server, browserEval, assertStderr }) {
  server.oops = async function () {};

  await browserEval(async () => {
    await server.oops({ someFunc: function () {} });
  });

  assertStderr("Couldn't serialize arguments for endpoint `oops`");
}

async function wrongServerUrl({ wildcardClient, assertStderr }) {
  try {
    wildcardClient.config.serverUrl = undefined;
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "You set `config.serverUrl==undefined` but it should be an HTTP address"
  );
}

async function unknownConfigServer({ wildcardClient }) {
  try {
    wildcardClient.config.blablub = undefined;
  } catch (err) {
    assert(err.message.includes("Unknown config `blablub`"));
  }
}

missingServerUrl.isIntegrationTest = true;
async function missingServerUrl({ assertStderr, WildcardClient }) {
  const wildcardClient = new WildcardClient();

  const save = global.__INTERNAL_wildcardServer_nodejs;
  delete global.__INTERNAL_wildcardServer_nodejs;

  try {
    await wildcardClient.endpoints.unexisting();
  } catch (err) {
    console.error(err);
  }

  assertStderr("`config.serverUrl` missing");

  global.__INTERNAL_wildcardServer_nodejs = save;
}