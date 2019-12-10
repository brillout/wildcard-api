const fetch = require('@brillout/fetch');
const assert = require('@brillout/assert');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, parse, ...args}) {
  const makeRequest = (
    addHandli(
      () => fetch(
        url,
        {
          credentials: 'same-origin',
          /*
          method: 'GET',
          /*/
          method: 'POST',
          ...args,
          //*/
          headers:{
            'Content-Type': 'application/json',
            ...(args||{}).headers,
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
    const err = networkError;
    Object.assign(
      err,
      {
        isNetworkError,
        isServerError,
        response: null,
      },
    );
    assert.internal(err.isNetworkError===true);
    throw err;
  }
  const body = await response.text();
  const contentType = response.headers.get('content-type');
  const isOk = response.ok;
  assert.internal([true, false].includes(isOk));
  const statusCode = response.status;
  assert.internal(statusCode.constructor===Number);
  isServerError = 500<=statusCode && statusCode<=599;

  const value = (
    // TODO use mime type instead
    contentType.includes('application/json') ? (
      parse(body)
    ) : (
      body
    )
  );

  if( !isOk ) {
    const err = new Error();
    Object.assign(
      err,
      {
        isNetworkError,
        isServerError,
        response: {
          body,
          value,
          statusCode,
        },
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
