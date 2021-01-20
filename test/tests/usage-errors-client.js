module.exports = [
  telefunctionManipulationWithClient,
  cannotSerialize,
  wrongServerUrl,
  missingServerUrl,
];

async function telefunctionManipulationWithClient({
  telefuncClient,
  assertStderr,
}) {
  try {
    telefuncClient.telefunctions.thatWontHappen = async function () {};
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "You cannot add or modify telefunctions with the Telefunc Client"
  );
}

async function cannotSerialize({ server, browserEval, assertStderr }) {
  server.oops = async function () {};

  await browserEval(async () => {
    await window.telefunc.server.oops({ someFunc: function () {} });
  });

  assertStderr("Couldn't serialize arguments for telefunction `oops`");
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
    await telefuncClient.telefunctions.unexisting();
  } catch (err) {
    console.error(err);
  }

  assertStderr(
    "`config.serverUrl` missing. You are using the Telefunc client in Node.js, and the Telefunc client is loaded in a different Node.js process than the Node.js process that loaded the Telefunc server; the `config.serverUrl` configuration is required."
  );

  global.__INTERNAL_telefuncServer_nodejs = save;
}
