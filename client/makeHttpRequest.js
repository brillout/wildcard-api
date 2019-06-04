const fetch = require('@brillout/fetch');
const assert = require('@brillout/reassert');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, ...args}) {
  const runFetchRequest = () => fetch(
    url,
    {
      method: 'POST',
      credentials: 'same-origin',
      ...args
    }
  );

  const response = await makeRequest(runFetchRequest);
  const body = await response.text();
  const contentType = response.headers.get('content-type');
  const isOk = response.ok;
  assert.internal([true, false].includes(isOk));

  return {
    // TODO return mime type instead
    contentType,
    body,
    isOk,
  };
}

function makeRequest(runFetchRequest) {
  if( typeof window !== "undefined" && window.handli ) {
    return window.handli(runFetchRequest)
  }
  return runFetchRequest();
}
