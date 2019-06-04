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
    let ret;
    try {
      ret = await window.endpoints.testEndpointBug();
    } catch(err_) {
      err = err_;
    }
		assert('isNetworkError' in err, 'Problem passing error object', {errMessage: err.message, errKey: Object.keys(err)});
    assert(err);
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
      let errorThrown = false;
      try {
        await window.endpoints.testEndpointBug();
      } catch(err) {
        assert(err.isNetworkError===true);
        assert(err.isServerError===null);
        assert(err.response===null);
        errorThrown = true;
      }
      assert(errorThrown===true);
    },
    {offlineMode: true},
  );
}
