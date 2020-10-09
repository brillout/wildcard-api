import { assert } from "@brillout/assert";
// @ts-ignore
import { parse } from "@brillout/json-s";
// @ts-ignore
import fetch = require("@brillout/fetch");
import {
  EndpointName,
  EndpointResult,
  HttpRequestBody,
  HttpRequestUrl,
} from "./WildcardClient";

type EndpointError = Error & {
  isConnectionError: boolean;
  isCodeError: boolean;
};

export { makeHttpRequest };

async function makeHttpRequest(
  url: HttpRequestUrl,
  body: HttpRequestBody | undefined,
  endpointName: EndpointName
): Promise<EndpointResult> {
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
  let connectionError: EndpointError | undefined;
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

  // Status codes ever returned by the Wilcard server:
  //  - 200
  //  - 400
  //  - 404
  //  - 500
  assert([500, 404].includes(statusCode));

  const codeErrorText =
    statusCode === 404
      ? `Endpoint \`${endpointName}\` does not exist.`
      : `Endpoint function \`${endpointName}\` threw an error.`;

  const codeError: EndpointError = Object.assign(new Error(codeErrorText), {
    isConnectionError: false,
    isCodeError: true,
  });

  throw codeError;
}

function addHandli(fetcher: () => Promise<EndpointResult>) {
  return () => {
    if (
      typeof window !== "undefined" &&
      window.handli &&
      window.handli.constructor === Function
    ) {
      return window.handli(fetcher);
    }
    return fetcher();
  };
}

declare global {
  interface Window {
    handli?: any;
  }
}
