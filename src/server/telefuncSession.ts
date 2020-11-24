// TODO
//  - clean signature cookie upon client-side context removal
//  - update docs
//    - update getApiHttpResponse

// @ts-ignore
import { stringify, parse } from "@brillout/json-s";
import { createHmac } from "crypto";
import {
  ContextModifications,
  HttpRequestHeaders,
  HttpResponseHeader,
  ContextObject,
} from "./TelefuncServer";
import { assertUsage, getUsageError } from "@brillout/assert";
import cookie = require("cookie");

//*
type Cookie = {
  cookieName: string;
  cookieValue: string;
  cookieOptions: { maxAge: number; httpOnly?: boolean; secure?: boolean };
};
//*/

let secretKey: string | null = null;

export { setSecretKey };
export { getSecretKey };
export { getSetCookieHeaders };
export { getContextFromCookies };

const cookieNamePrefix = "telefunc-context_";
const signatureCookieNamePrefix = "telefunc-context-signaure_";

function getContextFromCookies(
  headers: HttpRequestHeaders | undefined
): ContextObject | null {
  if (headers === undefined) {
    return null;
  }
  if (secretKey === null) {
    return null;
  }
  let contextObject: ContextObject | null = null;
  const cookies = cookie.parse(headers.cookie);
  Object.entries(cookies).forEach(([cookieName, cookieValue]) => {
    if (!cookieName.startsWith(cookieNamePrefix)) {
      return;
    }
    const contextName = cookieName.slice(cookieNamePrefix.length);
    const signature = cookies[signatureCookieNamePrefix + contextName];
    const contextValueSerialized = cookieValue;
    if (
      !signature ||
      signature !==
        computeSignature(contextValueSerialized, secretKey as string)
    ) {
      const wrongSignature = getUsageError(
        "Cookie signature is missing or wrong. It seems that someone is doing a (failed) attempt at hacking your user."
      );
      console.error(wrongSignature);
      return;
    }
    const contextValue = deserializeContext(contextValueSerialized);
    contextObject = contextObject || {};
    contextObject[contextName] = contextValue;
  });
  return contextObject;
}

function setSecretKey(secretKeyValue: string) {
  assertUsage(
    secretKey === null,
    "You should call `setSecretKey()` only once."
  );
  const len = secretKeyValue.length;
  assertUsage(
    len > 10,
    "You are calling `setSecretKey(key)` with a `key` of length `" +
      len +
      "`, but `key` should have at least 10 characters."
  );

  secretKey = secretKeyValue;
}

function getSecretKey(): string | null {
  return secretKey;
}

function getSetCookieHeaders(
  contextModifications: ContextModifications
): HttpResponseHeader[] | null {
  if (contextModifications === null) {
    return null;
  }
  if (secretKey === null) {
    return null;
  }

  // HTTP spec expects seconds
  // Express.js expects milliseconds
  const maxAge = 10 * 365 * 24 * 60 * 60 * 1000;

  const cookies: Cookie[] = [];

  Object.entries(contextModifications).forEach(
    ([contextName, contextValue]: [
      contextName: string,
      contextValue: unknown
    ]) => {
      const contextSerialized = serializeContext(contextValue);
      cookies.push(
        ...[
          {
            cookieName: cookieNamePrefix + contextName,
            cookieValue: contextSerialized,
            cookieOptions: {
              maxAge,
            },
          },
          {
            cookieName: signatureCookieNamePrefix + contextName,
            cookieValue: computeSignature(
              contextSerialized,
              secretKey as string
            ),
            cookieOptions: {
              httpOnly: true,
              secure: true,
              maxAge,
            },
          },
        ]
      );
    }
  );

  const setCookieHeaders: HttpResponseHeader[] = [];
  cookies.forEach(({ cookieName, cookieValue, cookieOptions }) => {
    const name = "Set-Cookie";
    const value = cookie.serialize(cookieName, cookieValue, cookieOptions);
    setCookieHeaders.push({ name, value });
  });

  return setCookieHeaders;
}

function serializeContext(contextValue: unknown): string {
  const contextValueSerialized = stringify(contextValue);
  return contextValueSerialized;
}
function deserializeContext(contextValueSerialized: string): unknown {
  const contextValue = parse(contextValueSerialized);
  return contextValue;
}

function computeSignature(
  contextValueSerialized: string,
  secretKey: string
): string {
  const hmac = createHmac("SHA256", secretKey);
  const hash = hmac.update(contextValueSerialized).digest("latin1");
  return hash;
}
