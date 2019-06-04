module.exports = [
  bugHandling,
  networkHandling,
];

async function bugHandling({wildcardApi, browserEval}) {
  wildcardApi.endpoints.testEndpointBug = async function() {
    throw new Error('This is a simulated bug');
    return "You shouldn't see me";
  };

  await browserEval(async () => {
    let err = null;
    try {
      await window.endpoints.testEndpointBug();
    } catch(err_) {
      err = err_;
    }
    assert(err);
    assert('isNetworkError' in err, 'Internal error in Wildcard client', {errMessage: err.message});
    assert(err.isServerError===true);
    assert(err.isNetworkError===false);
    assert(err.response.statusCode===500);
    assert(err.response.value==='Internal Server Error');
  });
}

async function networkHandling({wildcardApi, browserEval}) {
  wildcardApi.endpoints.testEndpointBug = async function() {
    return "You shouldn't see me";
  };

  await browserEval(
    async () => {
      let err = null;
      try {
        await window.endpoints.testEndpointBug();
      } catch(err_) {
        err = err_;
      }
      assert(err);
		  assert('isNetworkError' in err, 'Internal error in Wildcard client', {errMessage: err.message});
      assert(err.isNetworkError===true);
      assert(err.isServerError===null);
      assert(err.response===null);
    },
    {offlineMode: true},
  );
}
