const fetch = require('@brillout/fetch');

async function makeHttpRequest({url, ...args}) {
  const response = await fetch(
    url,
    {
      method: 'POST',
      credentials: 'same-origin',
      ...args
    }
  );
  const body = await response.text();
  return body;
}
