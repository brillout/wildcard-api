const fetch = require('@brillout/fetch');
const FetchErrorHandler = require('./FetchErrorHandler');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, ...args}) {
  const errorHandler = new FetchErrorHandler({
    noInternetConnection: true,
  });

  const response = await errorHandler(() => fetch(
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
