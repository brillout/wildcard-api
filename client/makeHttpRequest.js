const fetch = require('@brillout/fetch');
const assert = require('@brillout/assert');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, parse, body}) {
  const makeRequest = (
    addHandli(
      () => fetch(
        url,
        {
          /* Also enable `DEBUG_CACHE` flag on server-side.
          method: 'GET',
          /*/
          method: 'POST',
          body,
          //*/
          credentials: 'same-origin',
          headers:{
            'Content-Type': 'application/json',
          },
        },
      )
    )
  );

  let response;
  let isNetworkError = false;
  let isServerError = null;
  let networkError;
  try {
    response = await makeRequest();
  } catch(err) {
    isNetworkError = true;
    networkError = err;
  }
  if( isNetworkError ){
    const err = new Error('No Server Connection');
    Object.assign(
      err,
      {
        isNetworkError,
        isServerError,
      },
    );
    assert.internal(err.isNetworkError===true);
    throw err;
  }
  const responseBody = await response.text();
  const contentType = response.headers.get('content-type');
  const isOk = response.ok;
  assert.internal([true, false].includes(isOk));
  const statusCode = response.status;
  assert.internal(statusCode.constructor===Number);
  isServerError = 500<=statusCode && statusCode<=599;

  const value = (
    // TODO use mime type instead
    contentType.includes('application/json') ? (
      parse(responseBody)
    ) : (
      responseBody
    )
  );

  if( !isOk ) {
    const err = new Error('Internal Server Error');
    Object.assign(
      err,
      {
        isNetworkError,
        isServerError,
      },
    );
    assert.internal(err.isNetworkError===false);
    throw err;
  }

  return value;
}

function addHandli(fetch_) {
  return () => {
    if( typeof window !== "undefined" && window.handli ) {
      return window.handli(fetch_)
    }
    return fetch_();
  };
}
