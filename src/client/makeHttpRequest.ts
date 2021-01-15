import { assert } from "./assert";
// @ts-ignore
import { parse } from "@brillout/json-s";
// @ts-ignore
import fetch = require("@brillout/fetch");
import {
  TelefunctionName,
  TelefunctionResult,
  HttpRequestBody,
  HttpRequestUrl,
} from "./TelefuncClient";

export { makeHttpRequest };
export { TelefuncError };

async function makeHttpRequest(
  url: HttpRequestUrl,
  body: HttpRequestBody | undefined,
  endpointName: TelefunctionName
): Promise<TelefunctionResult> {
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
  let isConnectionError: boolean = false;
  try {
    response = await makeRequest();
  } catch (_) {
    isConnectionError = true;
  }

  if (isConnectionError) {
    throw new TelefuncError("No Server Connection", {
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

  // The Telefunc client issued a malformatted request.
  assert(statusCode !== 400);

  // Status codes ever returned by the Wilcard server:
  //  - 200
  //  - 400
  //  - 404
  //  - 500
  assert([500, 404].includes(statusCode));

  const codeErrorText =
    statusCode === 404
      ? `Telefunction \`${endpointName}\` does not exist. Check the server-side error for more information.`
      : `Telefunction \`${endpointName}\` threw an error.`;

  throw new TelefuncError(codeErrorText, {
    isConnectionError: false,
    isCodeError: true,
  });
}

class TelefuncError extends Error {
  isCodeError: boolean;
  isConnectionError: boolean;
  constructor(
    message: string,
    {
      isCodeError,
      isConnectionError,
    }: { isCodeError: boolean; isConnectionError: boolean }
  ) {
    super(message);

    // Bugfix: https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, TelefuncError.prototype);

    this.isConnectionError = isConnectionError;
    this.isCodeError = isCodeError;

    assert(this.message === message);
    assert(this.isConnectionError !== this.isCodeError);
  }
}

function addHandli(fetcher: () => Promise<TelefunctionResult>) {
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
