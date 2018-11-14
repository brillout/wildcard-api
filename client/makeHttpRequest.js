const fetch = require('@brillout/fetch');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, ...args}) {
  const response = await fetch(
    url,
    {
      method: 'POST',
      credentials: 'same-origin',
      ...args
    }
  );
  const responseText = await response.text();
  return responseText;
}
