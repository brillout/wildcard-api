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
      type: 'text/plain',
      body: 'custom error handling',
    });
  };

  await browserEval(async () => {
    let errorThrown = false;
    let ret;
    try {
      ret = await window.endpoints.hello();
    } catch(err) {
      assert('isNetworkError' in err, 'Problem passing error object', {errMessage: err.message, errKey: Object.keys(err)});
      assert(err.isServerError===false);
      assert(err.isNetworkError===false);
      assert(err.response.statusCode===401);
      assert(err.response.value==='custom error handling');
      errorThrown = true;
    }
    assert(errorThrown===true);
    /*
    assert(
      ret==='custom error handling',
      {ret},
    );
    */
  });

  assert(called===1);
};
