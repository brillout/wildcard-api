// TODO
//  - clean signature cookie upon client-side context removal
//  - add tests
//    - when security token is corrupt
//    - all assertUsage
//  - Try secure cookies
//  - Investiage sameSite
//  - Make context available outside of telefunc
//  - update docs
//    - update getApiHttpResponse

// @ts-ignore
import { stringify, parse } from "@brillout/json-s";
import { createHmac } from "crypto";
import {
  ContextModifications,
  HttpRequestHeaders,
  ContextObject,
  TelefuncServer,
} from "./TelefuncServer";
import { assertUsage, getUsageError } from "@brillout/assert";
import cookie = require("cookie");

type Cookie = {
  cookieName: string;
  cookieValue: string;
  cookieOptions: {
    path: string;
    maxAge: number;
    httpOnly?: boolean;
    secure?: boolean;
  };
};

export const _secretKey = Symbol("_secretKey");
export type SecretKey = string | null;

export { setSecretKey };
export { getSetCookieHeader };
export { getContextFromCookies };

const cookieNamePrefix = "telefunc-context_";
const signatureCookieNamePrefix = "telefunc-context-signaure_";

function getContextFromCookies(
  secretKey: SecretKey,
  headers: HttpRequestHeaders | undefined
): ContextObject | null {
  if (!headers) {
    return null;
  }
  if (!headers.cookie) {
    return null;
  }
  if (!secretKey) {
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

function setSecretKey(this: TelefuncServer, secretKey: string) {
  assertUsage(
    this[_secretKey] === null,
    "You should call `setSecretKey()` only once."
  );
  assertUsage(secretKey, "Argument `key` missing in `setSecretKey(key)` call.");
  const len = secretKey.length;
  assertUsage(
    len > 10,
    "You are calling `setSecretKey(key)` with a `key` of length `" +
      len +
      "`, but `key` should have at least 10 characters."
  );

  this[_secretKey] = secretKey;
}

function getSetCookieHeader(
  secretKey: SecretKey,
  contextModifications: ContextModifications
): string[] | null {
  if (contextModifications.mods === null) {
    return null;
  }
  if (secretKey === null) {
    return null;
  }

  const maxAge = 10 * 365 * 24 * 60 * 60;
  const path = "/";

  const cookies: Cookie[] = [];

  Object.entries(contextModifications.mods).forEach(
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
              path,
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
              path,
              maxAge,
              httpOnly: true,
              // sameSite: 'Strict',
              // secure: true,
            },
          },
        ]
      );
    }
  );

  const values: string[] = [];
  cookies.forEach(({ cookieName, cookieValue, cookieOptions }) => {
    const value = cookie.serialize(cookieName, cookieValue, cookieOptions);
    values.push(value);
  });
  return values;
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
  const hash = hmac.update(contextValueSerialized).digest("hex");
  return hash;
}
