const fetch = require('@brillout/fetch');
const handli = require('handli');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, ...args}) {
  const response = await handli(() => fetch(
    url,
    {
      method: 'POST',
      credentials: 'same-origin',
      ...args
    }
  ));

  const responseText = await response.text();
  return responseText;
}
