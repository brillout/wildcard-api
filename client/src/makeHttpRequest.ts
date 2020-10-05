import { assert } from "@brillout/assert";
import fetch = require("@brillout/fetch");

export { makeHttpRequest };

type EndpointError = Error & {
  isConnectionError: boolean;
  isCodeError: boolean;
};

async function makeHttpRequest({ url, parse, body, endpointName }) {
  const makeRequest = addHandli(() =>
    fetch(url, {
      /* Also enable `DEBUG_CACHE` flag on server-side.
          method: 'GET',
          /*/
      method: "POST",
      body,
      //*/
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
    })
  );

  let response;
  let connectionError: Error;
  try {
    response = await makeRequest();
  } catch (err) {
    connectionError = err;
  }

  if (connectionError) {
    throw Object.assign(new Error("No Server Connection"), {
      isConnectionError: true,
      isCodeError: false,
    });
  }

  const responseBody = await response.text();
  const contentType = response.headers.get("content-type");
  const isOk = response.ok;
  assert([true, false].includes(isOk));

  const value =
    // TODO use mime type instead
    contentType.includes("application/json")
      ? parse(responseBody)
      : responseBody;

  const statusCode = response.status;

  if (isOk) {
    assert(statusCode === 200);
    return value;
  }

  // The Wildcard client issued a malformatted request.
  assert(statusCode !== 400);

  // Unexpected HTTP response status code
  assert([500, 404].includes(statusCode));

  const codeErrorText =
    statusCode === 404
      ? `Endpoint \`${endpointName}\` does not exist.`
      : `Endpoint function \`${endpointName}\` threw an error.`;

  throw Object.assign(new Error(codeErrorText), {
    isConnectionError: false,
    isCodeError: true,
  });
}

function addHandli(fetch_) {
  return () => {
    if (
      typeof window !== "undefined" &&
      window.handli &&
      window.handli.constructor === Function
    ) {
      return window.handli(fetch_);
    }
    return fetch_();
  };
}

declare global {
  interface Window {
    handli?: any;
  }
}
