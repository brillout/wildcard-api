import { assert } from "@brillout/assert";
import fetch = require("@brillout/fetch");

export { makeHttpRequest };

type EndpointError = Error & {
  isNetworkError: boolean;
  isServerError: boolean;
};

async function makeHttpRequest({ url, parse, body }) {
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
  let isNetworkError = false;
  let isServerError = null;
  let networkError;
  try {
    response = await makeRequest();
  } catch (err) {
    isNetworkError = true;
    networkError = err;
  }
  if (isNetworkError) {
    const err: EndpointError = Object.assign(
      new Error("No Server Connection"),
      {
        isNetworkError,
        isServerError,
      }
    );
    assert(err.isNetworkError === true);
    throw err;
  }
  const responseBody = await response.text();
  const contentType = response.headers.get("content-type");
  const isOk = response.ok;
  assert([true, false].includes(isOk));
  const statusCode = response.status;
  assert(statusCode.constructor === Number);
  isServerError = 500 <= statusCode && statusCode <= 599;

  const value =
    // TODO use mime type instead
    contentType.includes("application/json")
      ? parse(responseBody)
      : responseBody;

  if (!isOk) {
    const err: EndpointError = Object.assign(
      new Error("Internal Server Error"),
      {
        isNetworkError,
        isServerError,
      }
    );
    assert(err.isNetworkError === false);
    throw err;
  }

  return value;
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
