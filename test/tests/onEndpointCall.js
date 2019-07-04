module.exports = [
  interceptSuccessfullResponse,
  interceptError,
];

async function interceptSuccessfullResponse({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = function(name) { return 'hi '+name };

  let called = 0;
  wildcardApi.onEndpointCall = function({endpointName, endpointArgs, endpointResult, endpointError, overwriteResult}) {
    ++called;
    assert(endpointName==='hello');
    assert(endpointArgs[0]==='john');
    assert(endpointArgs.length===1);
    assert(endpointResult==='hi john');
    assert(!endpointError);
    overwriteResult('hey alice');
  };

  await browserEval(async () => {
    const ret = await window.endpoints.hello('john');
    assert(
      ret!=='hi john',
      "Interception didn't work",
    );
    assert(
      ret==='hey alice',
      {ret},
    );
  });

  assert(called===1);
};

async function interceptError({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = function(name) { throw new Error('Errolus'); };

  let called = 0;
  wildcardApi.onEndpointCall = function({endpointName, endpointArgs, endpointResult, endpointError, overwriteResponse}) {
    ++called;
    assert(endpointResult===undefined);
    assert(endpointError.constructor===Error);
    assert(endpointError.message==='Errolus');
    overwriteResponse({
      statusCode: 401,
      contentType: 'text/plain',
      body: 'custom error handling',
    });
  };

  await browserEval(async () => {
    let err = null;
    try {
      await window.endpoints.hello();
    } catch(err_) {
      err = err_;
    }
    assert(err);
    assert('isNetworkError' in err, 'Internal error in Wildcard client', {errMessage: err.message});
    assert(err.isServerError===false);
    assert(err.isNetworkError===false);
    assert(err.response.statusCode===401);
    assert(err.response.value==='custom error handling');
  });

  assert(called===1);
};
