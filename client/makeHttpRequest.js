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

  const responseText = await response.text();
  return responseText;
}

function makeRequest(runFetchRequest) {
  if( typeof window !== "undefined" && window.handli ) {
    return window.handli(runFetchRequest)
  }
  return runFetchRequest();
}
