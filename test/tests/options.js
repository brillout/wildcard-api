module.exports = [
  option_argumentsAlwaysInHttpBody_1,
  option_argumentsAlwaysInHttpBody_2,
];

async function option_argumentsAlwaysInHttpBody_1({wildcardApi, browserEval}) {
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
    assert(request._url==='http://localhost:3000/wildcard/testEndpoint__argumentsAlwaysInHttpBody/%5B%22just%20some%20args%22%5D', request._url);
    assert(request._postData==='[]', request._postData);

    execCount++;
  }
}

async function option_argumentsAlwaysInHttpBody_2({wildcardApi, browserEval}) {
  let endpointCalled = false;
  let onHttpRequestCalled = false;

  wildcardApi.endpoints.testEndpoint__argumentsAlwaysInHttpBody = async function(arg) {
    assert(arg==='just some args');
    endpointCalled = true;
  };

  await browserEval(async () => {
    const {WildcardClient} = window;
    const endpoints = new WildcardClient({argumentsAlwaysInHttpBody: true});
    await endpoints.testEndpoint__argumentsAlwaysInHttpBody('just some args');
  }, {onHttpRequest});

  assert(endpointCalled && onHttpRequestCalled);

  function onHttpRequest(request) {
    assert(request._url==='http://localhost:3000/wildcard/testEndpoint__argumentsAlwaysInHttpBody', request._url);
    assert(request._postData==='["just some args"]', request._postData);

    onHttpRequestCalled = true;
  }
}
