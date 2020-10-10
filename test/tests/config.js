module.exports = [configClient, configServer];

async function configClient({ wildcardClient: { config }, wildcardServer }) {
  // Existing configs
  assert(Object.keys(config).length === 4);

  // Default values
  assert(config.argumentsAlwaysInHttpBody === false);
  assert(config.baseUrl === "/_wildcard_api/");
  assert(config.serverUrl === null);

  // Test setups overrides default value
  assert(config.__INTERNAL_wildcardServer_test === wildcardServer);

  // Throw upon unknown config
  try {
    config.blablub = undefined;
  } catch (err) {
    assert(err.message.includes("Unknown config `blablub`"));
  }
}

async function configServer({ wildcardServer: { config } }) {
  // Existing configs
  assert(Object.keys(config).length === 2);

  // Default values
  assert(config.disableEtag === false);
  assert(config.baseUrl === "/_wildcard_api/");

  // Throw upon unknown config
  try {
    config.bliblab = undefined;
  } catch (err) {
    assert(err.message.includes("Unknown config `bliblab`"));
  }
}
