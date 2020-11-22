module.exports = [
  option_shortUrl_1,
  option_shortUrl_2,
  option_serverUrl,
  option_baseUrl,
];

async function option_shortUrl_1({
  server,
  browserEval,
  httpPort,
}) {
  let execCount = 0;

  server.testEndpoint__shortUrl = async function (arg) {
    assert(arg === "just some args");
    execCount++;
  };

  await browserEval(
    async () => {
      await server.testEndpoint__shortUrl("just some args");
    },
    { onHttpRequest }
  );

  assert(execCount === 2, { execCount });

  function onHttpRequest(request) {
    const { _url, _postData } = request;
    assert(
      _url ===
        "http://localhost:" +
          httpPort +
          "/_wildcard_api/testEndpoint__shortUrl/%5B%22just%20some%20args%22%5D",
      { _url }
    );
    assert(_postData === undefined, { _postData });

    execCount++;
  }
}

async function option_shortUrl_2({
  server,
  browserEval,
  httpPort,
}) {
  let endpointCalled = false;
  let onHttpRequestCalled = false;

  server.testEndpoint__shortUrl = async function (arg) {
    assert(arg === "just some args");
    endpointCalled = true;
  };

  await browserEval(
    async () => {
      const { config } = window;
      assert(config.shortUrl === false);
      config.shortUrl = true;
      await window.server.testEndpoint__shortUrl(
        "just some args"
      );
      config.shortUrl = false;
    },
    { onHttpRequest }
  );

  assert(endpointCalled && onHttpRequestCalled);

  function onHttpRequest(request) {
    const { _url, _postData } = request;
    assert(
      _url ===
        "http://localhost:" +
          httpPort +
          "/_wildcard_api/testEndpoint__shortUrl/args-in-body",
      { _url }
    );
    assert(_postData === '["just some args"]', { _postData });

    onHttpRequestCalled = true;
  }
}

async function option_serverUrl({ server, browserEval, httpPort }) {
  let endpointCalled = false;
  let onHttpRequestCalled = false;

  server.test_serverUrl = async function () {
    endpointCalled = true;
  };

  const wrongHttpPort = 3449;
  assert(httpPort.constructor === Number && httpPort !== wrongHttpPort);
  await browserEval(
    async ({ wrongHttpPort }) => {
      const { TelefuncClient } = window;
      const telefuncClient = new TelefuncClient();
      telefuncClient.config.serverUrl = "http://localhost:" + wrongHttpPort;
      const server = telefuncClient.endpoints;
      let failed = false;
      try {
        await server.test_serverUrl();
      } catch (err) {
        failed = true;
      }
      assert(failed === true, { failed });
    },
    { onHttpRequest, browserArgs: { wrongHttpPort } }
  );

  assert(endpointCalled === false && onHttpRequestCalled === true, {
    endpointCalled,
    onHttpRequestCalled,
  });

  function onHttpRequest(request) {
    assert(
      request._url.startsWith("http://localhost:" + wrongHttpPort),
      request._url
    );
    onHttpRequestCalled = true;
  }
}

async function option_baseUrl({ server, config, browserEval, httpPort }) {
  let endpointCalled = false;
  let onHttpRequestCalled = false;

  const baseUrl = (config.baseUrl = "/_api/my_custom_base/");
  server.test_baseUrl = async function () {
    endpointCalled = true;
  };

  await browserEval(
    async ({ baseUrl }) => {
      const { TelefuncClient } = window;
      const telefuncClient = new TelefuncClient();
      telefuncClient.config.baseUrl = baseUrl;
      const server = telefuncClient.endpoints;
      await server.test_baseUrl();
    },
    { onHttpRequest, browserArgs: { baseUrl } }
  );

  assert(endpointCalled === true && onHttpRequestCalled === true, {
    endpointCalled,
    onHttpRequestCalled,
  });

  function onHttpRequest(request) {
    const correctUrlBeginning = "http://localhost:" + httpPort + baseUrl;
    const actualUrl = request._url;
    assert(actualUrl.startsWith(correctUrlBeginning), {
      actualUrl,
      correctUrlBeginning,
    });
    onHttpRequestCalled = true;
  }
}
