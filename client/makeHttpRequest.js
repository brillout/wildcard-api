const fetch = require('@brillout/fetch');

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

  return {
    // TODO return mime type instead
    contentType,
    body,
  };
}

function makeRequest(runFetchRequest) {
  if( typeof window !== "undefined" && window.handli ) {
    return window.handli(runFetchRequest)
  }
  return runFetchRequest();
}
