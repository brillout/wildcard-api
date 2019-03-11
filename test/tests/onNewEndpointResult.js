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
    assert(
      ret==='hey alice',
      {ret},
    );
  });

  assert(called===1);
};

async function interceptError(wildcardApi, {browserEval}) {
  wildcardApi.endpoints.hello = function(name) { throw new Error('Errolus'); };

  let called = 0;
  wildcardApi.onNewEndpointResult = function({endpointName, endpointArgs, endpointResult, endpointError}) {
    ++called;
    assert(endpointResult===undefined);
    assert(endpointError.constructor===Error);
    assert(endpointError.message==='Errolus');
    this.statusCode = 401;
    this.type = 'text/plain';
    this.body = 'custom error handling';
  };

  await browserEval(async () => {
    const ret = await window.endpoints.hello();
    assert(
      ret==='custom error handling',
      {ret},
    );
  });

  assert(called===1);
};
