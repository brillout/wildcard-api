const fetch = require('@brillout/fetch');
const handli = require('handli');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, ...args}) {
  const makeRequest = () => fetch(
    url,
    {
      method: 'POST',
      credentials: 'same-origin',
      ...args
    }
  );

  const response = await (isBrowser() ? handli(makeRequest) : makeRequest());

  const responseText = await response.text();
  return responseText;
}

function isBrowser() {
  return typeof window !== "undefined" && window.document;
}
