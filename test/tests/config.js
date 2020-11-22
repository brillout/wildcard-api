module.exports = [configClient, configServer];

async function configClient({ telefuncClient: { config }, telefuncServer }) {
  // Existing configs
  assert(Object.keys(config).length === 4);

  // Default values
  assert(config.shortUrl === false);
  assert(config.baseUrl === "/_wildcard_api/");
  assert(config.serverUrl === null);

  // Test setups overrides default value
  assert(config.__INTERNAL_telefuncServer_test === telefuncServer);

  // Throw upon unknown config
  try {
    config.blablub = undefined;
  } catch (err) {
    assert(err.message.includes("Unknown config `blablub`"));
  }
}

async function configServer({ telefuncServer: { config } }) {
  // Existing configs
  assert(Object.keys(config).length === 2);

  // Default values
  assert(config.disableCache === false);
  assert(config.baseUrl === "/_wildcard_api/");

  // Throw upon unknown config
  try {
    config.bliblab = undefined;
  } catch (err) {
    assert(err.message.includes("Unknown config `bliblab`"));
  }
}
