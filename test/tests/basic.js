module.exports = [
  mostBasicUseCase,
  requestObjectIsAvailbe,
];

async function mostBasicUseCase({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Dear '+name;
  };

  await browserEval(async () => {
    const ret = await window.endpoints.hello('rom');
    assert(
      ret==='Dear rom',
      {ret},
    );
  });
}

async function requestObjectIsAvailbe({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    assert(this.headers.host.startsWith('localhost'));
    assert(this.headers['user-agent'].includes('HeadlessChrome'));
    return 'Servus '+name;
  };

  await browserEval(async () => {
    const ret = await window.endpoints.hello('Romuald');
    assert(
      ret==='Servus Romuald',
      {ret},
    );
  });
}
