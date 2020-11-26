import { assert } from "@brillout/libassert";
import { createHash } from "crypto";

module.exports = computeEtag;

function computeEtag(body: string): string {
  const etagValue = getEtagValue(body);
  assert(!etagValue.includes('"'));
  return `"${etagValue}"`;
}

function getEtagValue(body: string): string {
  if (body.length === 0) {
    // fast-path empty body
    return "1B2M2Y8AsgTpgAmY7PhCfg==";
  }

  return createHash("md5").update(body, "utf8").digest("base64");
}
