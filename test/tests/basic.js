module.exports = [
  basic,
  basicContext,
];

async function basic({wildcardApi, browserEval}) {
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
};

async function basicContext({wildcardApi, browserEval}) {
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
};
