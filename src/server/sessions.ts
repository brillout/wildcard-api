// TODO
//  - clean signature cookie upon client-side context removal
//  - add TS support for client-side `context` object
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
  ContextObject,
  TelefuncServer,
} from "./TelefuncServer";
import { assertUsage, assertWarning, assert } from "./assert";
import cookieModule = require("cookie");

export { __getContextFromCookie };
export { getSetCookieHeader };
export { __setSecretKey };
export const __secretKey = Symbol("__secretKey");
export type SecretKey = string | null;

const COOKIE_NAME = "telefunc_";
const COOKIE_SIGNATURE_NAME = "telefunc-signature_";

function __getContextFromCookie(
  secretKey: SecretKey,
  cookie: string | null | undefined
): ContextObject | null {
  if (!cookie) {
    return null;
  }
  if (!secretKey) {
    return null;
  }
  let contextObject: ContextObject | null = null;
  const cookies = cookieModule.parse(cookie);
  Object.entries(cookies).forEach(([cookieName, cookieValue]) => {
    if (!cookieName.startsWith(COOKIE_NAME)) {
      return;
    }
    const contextName = cookieName.slice(COOKIE_NAME.length);
    const signature = cookies[COOKIE_SIGNATURE_NAME + contextName];
    const contextValueSerialized = cookieValue;
    if (
      !signature ||
      signature !==
        computeSignature(contextValueSerialized, secretKey as string)
    ) {
      assertWarning(
        false,
        "Cookie signature is missing or wrong. It seems that someone is doing a (failed) attempt at hacking your user."
      );
    }
    const contextValue = deserializeContext(contextValueSerialized);
    contextObject = contextObject || {};
    contextObject[contextName] = contextValue;
  });
  return contextObject;
}

function __setSecretKey(this: TelefuncServer, secretKey: string) {
  assertUsage(
    this[__secretKey] === null,
    "You should call `setSecretKey()` only once."
  );
  assertUsage(secretKey, "Argument `key` missing in `setSecretKey(key)` call.");
  const len = secretKey.length;
  assertUsage(
    len >= 10,
    "You are calling `setSecretKey(key)` with a `key` of length `" +
      len +
      "`, but `key` should have at least 10 characters."
  );

  this[__secretKey] = secretKey;
}

function getSetCookieHeader(
  secretKey: SecretKey,
  contextModifications: ContextObject
): string[] | null {
  if (Object.keys(contextModifications).length===0) {
    return null;
  }
  if (secretKey === null) {
    return null;
  }

  const maxAge = 10 * 365 * 24 * 60 * 60;
  const path = "/";

  const cookies: {
    cookieName: string;
    cookieValue: string;
    cookieOptions: {
      path: string;
      maxAge: number;
      httpOnly?: boolean;
      secure?: boolean;
    };
  }[] = [];

  Object.entries(contextModifications).forEach(
    ([contextName, contextValue]: [
      contextName: string,
      contextValue: unknown
    ]) => {
      const contextSerialized = serializeContext(contextValue);
      assert(secretKey !== null);
      assert(secretKey);
      cookies.push(
        ...[
          {
            cookieName: COOKIE_NAME + contextName,
            cookieValue: contextSerialized,
            cookieOptions: {
              path,
              maxAge,
            },
          },
          {
            cookieName: COOKIE_SIGNATURE_NAME + contextName,
            cookieValue: computeSignature(contextSerialized, secretKey),
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
    const value = cookieModule.serialize(
      cookieName,
      cookieValue,
      cookieOptions
    );
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
  assert(secretKey);
  const hmac = createHmac("SHA256", secretKey);
  const hash = hmac.update(contextValueSerialized).digest("hex");
  return hash;
}
