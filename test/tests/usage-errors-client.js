module.exports = [
  wrongBindUsage1,
  wrongBindUsage2,
  endpointManipulationWithClient,
  cannotSerialize,
  wrongServerUrl,
  missingServerUrl,
];

async function wrongBindUsage1({ server, browserEval, assertStderr }) {
  server.ohNo = async function () {};

  await browserEval(async () => {
    await server.ohNo.bind({ some: "context" })();
  });

  assertStderr(
    "Using `bind` to provide the context object is forbidden on the browser-side."
  );
}

async function wrongBindUsage2({ server, telefuncClient, assertStderr }) {
  server.hm = async function () {};

  try {
    telefuncClient.endpoints.hm.bind(null)();
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "The context object you `bind()` should be a `instanceof Object`."
  );
}

async function endpointManipulationWithClient({
  telefuncClient,
  assertStderr,
}) {
  try {
    telefuncClient.endpoints.thatWontHappen = async function () {};
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "You cannot add/modify endpoint functions with the Telefunc client"
  );
}

async function cannotSerialize({ server, browserEval, assertStderr }) {
  server.oops = async function () {};

  await browserEval(async () => {
    await server.oops({ someFunc: function () {} });
  });

  assertStderr("Couldn't serialize arguments for endpoint `oops`");
}

async function wrongServerUrl({ telefuncClient, assertStderr }) {
  try {
    telefuncClient.config.serverUrl = undefined;
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "You set `config.serverUrl==undefined` but it should be an HTTP address"
  );
}

missingServerUrl.isIntegrationTest = true;
async function missingServerUrl({ assertStderr, TelefuncClient }) {
  const telefuncClient = new TelefuncClient();

  const save = global.__INTERNAL_telefuncServer_nodejs;
  delete global.__INTERNAL_telefuncServer_nodejs;

  try {
    await telefuncClient.endpoints.unexisting();
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "`config.serverUrl` missing. You are using the Telefunc client in Node.js, and the Telefunc client is loaded in a different Node.js process than the Node.js process that loaded the Telefunc server; the `config.serverUrl` configuration is required."
  );

  global.__INTERNAL_telefuncServer_nodejs = save;
}
