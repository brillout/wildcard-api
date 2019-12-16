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
    const {isServerError, isNetworkError} = err;
    assert(
      'isNetworkError' in err && 'isServerError' in err,
      {err, isNetworkError, isServerError},
    );
    assert(
      err.isServerError===true,
      {err, isNetworkError, isServerError},
    );
    assert(
      err.isNetworkError===false,
      {err, isNetworkError, isServerError},
    );
    assert(
      err.message==='Internal Server Error',
      {err, isNetworkError, isServerError},
    );
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
      assert(err.message==='No Server Connection');
      assert(err.isNetworkError===true);
      assert(err.isServerError===null);
    },
    {offlineMode: true},
  );
}
