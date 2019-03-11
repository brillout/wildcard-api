module.exports = [
  interceptSuccessfullResponse,
  interceptError,
];

async function interceptSuccessfullResponse(wildcardApi, {browserEval}) {
  wildcardApi.endpoints.hello = function(name) { return 'hi '+name };

  let called = 0;
  wildcardApi.onNewEndpointResult = function({endpointName, endpointArgs, endpointResult}) {
    ++called;
    assert(endpointName==='hello');
    assert(endpointArgs[0]==='john');
    assert(endpointArgs.length===1);
    assert(endpointResult==='hi john');
    return 'hey alice';
  };

  await browserEval(async () => {
    const ret = await window.endpoints.hello('john');
    assert(ret==='hey alice');
  });

  assert(called===1);
};

async function interceptError(wildcardApi, {browserEval}) {
  wildcardApi.endpoints.hello = function(name) { throw new Error('Errolus'); };

  let called = 0;
  wildcardApi.onNewEndpointResult = function({endpointName, endpointArgs, endpointResult}) {
    ++called;
    assert(endpointResult.constructor===Error);
    assert(endpointResult.message==='Errolus');
    this.statusCode = 401;
    this.body = 'custom error handling';
  };

  await browserEval(async () => {
    try {
    const ret = await window.endpoints.hello();
    } catch(_) {}
    /*
    assert(ret==='custom error handling');
    */
  });

//assert(called===1);
};
