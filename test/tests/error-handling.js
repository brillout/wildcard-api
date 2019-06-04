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
    const ret = await window.endpoints.testEndpointBug();
    assert(ret==='Internal Server Error', {ret});
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
        errorThrown = true;
      }
      assert(errorThrown===true);
    },
    {offlineMode: true},
  );
}
