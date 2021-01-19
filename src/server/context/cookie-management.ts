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
import { ContextObject, TelefuncServer } from "../TelefuncServer";
import { assertUsage, assertWarning, assert } from "../utils/assert";
import cookieHelper = require("cookie");

export { getContextFromCookie };
export { getSetCookieHeader };
export { __setSecretKey };
export const __secretKey = Symbol("__secretKey");
export type SecretKey = string | null;

const COOKIE_NAME = "telefunc_";
const COOKIE_SIGNATURE_NAME = "telefunc-signature_";

function getContextFromCookie(
  contextProp: string,
  cookie: string | null | undefined,
  secretKey: SecretKey
): { contextValue: unknown } | { secretKeyMissing: true } | {} {
  assert(contextProp);

  if (!cookie) return {};
  assert(typeof cookie === "string");

  const cookieName = COOKIE_NAME + contextProp;
  const cookieSignatureName = COOKIE_SIGNATURE_NAME + contextProp;

  const cookieList = cookieHelper.parse(cookie);

  if (!(cookieName in cookieList)) return {};
  if (!secretKey) return { secretKeyMissing: true };

  const cookieValue = cookieList[cookieName];
  const cookieSignature = cookieList[cookieSignatureName];

  {
    const validSignature = computeSignature(cookieValue, secretKey);
    assert(validSignature);
    const isMissing = !(cookieSignatureName in cookieList);
    const isValid = cookieSignature === validSignature;
    /*
    assertWarning(
      isValid,
      `Telefunc cookie signature is ${isMissing ? "missing" : "wrong"}.`
    );
    */
    assert(!isMissing);
    if (!isValid) return {};
  }

  const contextValue = deserializeContext(cookieValue);
  return { contextValue };
}

function __setSecretKey(this: TelefuncServer, secretKey: string) {
  assertUsage(
    this[__secretKey] === null,
    "`setSecretKey()` should be called only once."
  );
  assertUsage(
    secretKey && secretKey.length && secretKey.length >= 10,
    "`setSecretKey(secretKey)`: Argument `secretKey` should be a string with a length of at least 10 characters."
  );

  this[__secretKey] = secretKey;
}

function getSetCookieHeader(
  secretKey: SecretKey,
  contextModifications: ContextObject
): string[] | null {
  if (Object.keys(contextModifications).length === 0) {
    return null;
  }
  if (secretKey === null) {
    return null;
  }

  const maxAge = 10 * 365 * 24 * 60 * 60;
  const path = "/";

  const cookieList: {
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
      cookieList.push(
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
  cookieList.forEach(({ cookieName, cookieValue, cookieOptions }) => {
    const value = cookieHelper.serialize(
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
