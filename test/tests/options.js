module.exports = [
  option_argumentsAlwaysInHttpBody_1,
  option_argumentsAlwaysInHttpBody_2,
  option_serverUrl,
  option_baseUrl,
];

async function option_argumentsAlwaysInHttpBody_1({wildcardApi, browserEval, httpPort}) {
  let execCount = 0;

  wildcardApi.endpoints.testEndpoint__argumentsAlwaysInHttpBody = async function(arg) {
    assert(arg==='just some args');
    execCount++;
  };

  await browserEval(async () => {
    await window.endpoints.testEndpoint__argumentsAlwaysInHttpBody('just some args');
  }, {onHttpRequest});

  assert(execCount===2, {execCount});

  function onHttpRequest(request) {
    const {_url, _postData} = request;
    assert(
      _url==='http://localhost:'+httpPort+'/_wildcard_api/testEndpoint__argumentsAlwaysInHttpBody/%5B%22just%20some%20args%22%5D',
      {_url},
    );
    assert(_postData===undefined, {_postData});

    execCount++;
  }
}

async function option_argumentsAlwaysInHttpBody_2({wildcardApi, browserEval, httpPort}) {
  let endpointCalled = false;
  let onHttpRequestCalled = false;

  wildcardApi.endpoints.testEndpoint__argumentsAlwaysInHttpBody = async function(arg) {
    assert(arg==='just some args');
    endpointCalled = true;
  };

  await browserEval(async () => {
    const {wildcardClient} = window;
    assert(wildcardClient.argumentsAlwaysInHttpBody===false);
    wildcardClient.argumentsAlwaysInHttpBody = true;
    await endpoints.testEndpoint__argumentsAlwaysInHttpBody('just some args');
    wildcardClient.argumentsAlwaysInHttpBody = false;
  }, {onHttpRequest});

  assert(endpointCalled && onHttpRequestCalled);

  function onHttpRequest(request) {
    const {_url, _postData} = request;
    assert(
      _url==='http://localhost:'+httpPort+'/_wildcard_api/testEndpoint__argumentsAlwaysInHttpBody/args-in-body',
      {_url},
    );
    assert(
      _postData==='["just some args"]',
      {_postData},
    );

    onHttpRequestCalled = true;
  }
}

async function option_serverUrl({wildcardApi, browserEval, httpPort}) {
  let endpointCalled = false;
  let onHttpRequestCalled = false;

  wildcardApi.endpoints.test_serverUrl = async function() {
    endpointCalled = true;
  };

  const wrongHttpPort = 3449;
  assert(httpPort.constructor===Number && httpPort!==wrongHttpPort);
  await browserEval(async ({wrongHttpPort}) => {
    const {WildcardClient} = window;
    const wildcardClient = new WildcardClient();
    wildcardClient.serverUrl = 'http://localhost:'+wrongHttpPort;
    const {endpoints} = wildcardClient;
    let failed = false;
    try {
      await endpoints.test_serverUrl();
    } catch(err) {
      failed = true;
    }
    assert(failed===true, {failed});
  }, {onHttpRequest, browserArgs: {wrongHttpPort}});

  assert(endpointCalled===false && onHttpRequestCalled===true, {endpointCalled, onHttpRequestCalled});

  function onHttpRequest(request) {
    assert(request._url.startsWith('http://localhost:'+wrongHttpPort), request._url);
    onHttpRequestCalled = true;
  }
}

async function option_baseUrl({wildcardApi, browserEval, httpPort}) {
  let endpointCalled = false;
  let onHttpRequestCalled = false;

  const baseUrl = wildcardApi.baseUrl = '/_api/my_custom_base/';
  wildcardApi.endpoints.test_baseUrl = async function() {
    endpointCalled = true;
  };

  await browserEval(async ({baseUrl}) => {
    const {WildcardClient} = window;
    const wildcardClient = new WildcardClient();
    wildcardClient.baseUrl = baseUrl;
    const {endpoints} = wildcardClient;
    await endpoints.test_baseUrl();
  }, {onHttpRequest, browserArgs: {baseUrl}});

  assert(endpointCalled===true && onHttpRequestCalled===true, {endpointCalled, onHttpRequestCalled});

  function onHttpRequest(request) {
    const correctUrlBeginning = 'http://localhost:'+httpPort+baseUrl;
    const actualUrl = request._url;
    assert(actualUrl.startsWith(correctUrlBeginning), {actualUrl, correctUrlBeginning});
    onHttpRequestCalled = true;
  }
}
