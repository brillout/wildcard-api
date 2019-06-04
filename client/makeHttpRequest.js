const fetch = require('@brillout/fetch');
const assert = require('@brillout/reassert');

module.exports = makeHttpRequest;

async function makeHttpRequest({url, parse, ...args}) {
  const makeRequest = (
    addHandli(
      () => fetch(
        url,
        {
          method: 'POST',
          credentials: 'same-origin',
          ...args
        },
      )
    )
  );

  let response;
  try {
    response = await makeRequest();
  } catch(err) {
    throw (
      new Error({
        networkError: true,
        err,
      })
    );
  }
  const body = await response.text();
  const contentType = response.headers.get('content-type');
  const isOk = response.ok;
  assert.internal([true, false].includes(isOk));

  const ret = (
    // TODO use mime type instead
    contentType.includes('application/json') ? (
      parse(body)
    ) : (
      body
    )
  );

  if( !isOk ) {
    throw (
      new Error({
        isServerError: true,
      })
    );
  }

  return ret;
}

function addHandli(fetch_) {
  return () => {
    if( typeof window !== "undefined" && window.handli ) {
      return window.handli(fetch_)
    }
    return fetch_();
  };
}
