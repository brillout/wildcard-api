module.exports = [
  bugHandling,
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
};
