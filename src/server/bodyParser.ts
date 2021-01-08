// https://github.com/vercel/next.js/blob/8bdff57b15211fb8af4714ade3bc26d285768d35/packages/next/next-server/server/api-utils.ts#L112-L146
// https://github.com/expressjs/body-parser
// https://github.com/stream-utils/raw-body
// https://github.com/cojs/co-body
// https://github.com/Raynos/body

import * as getRawBody from "raw-body";
import { IncomingMessage } from "http";

export { bodyParser };

async function bodyParser(
  req: IncomingMessage,
  { limit = "1mb" }: { limit?: string | number } = {}
): Promise<any> {
  /* TODO
  const contentType = parse(req.headers['content-type'] || 'text/plain')
  const { type, parameters } = contentType
  const encoding = parameters.charset || 'utf-8'
  */
  const encoding = "utf-8";

  let buffer;

  console.log("bef");
  try {
    buffer = await getRawBody(req, { encoding, limit });
  } catch (e) {
    /* TODO
    if (e.type === 'entity.too.large') {
      throw new ApiError(413, `Body exceeded ${limit} limit`)
    } else {
      throw new ApiError(400, 'Invalid body')
    }
    */
    throw e;
  }
  console.log("aft");

  const body = buffer.toString();

  console.log("body: `" + body + "`");

  /* TODO
  if (type === 'application/json' || type === 'application/ld+json') {
    return parseJson(body)
  } else if (type === 'application/x-www-form-urlencoded') {
    const qs = require('querystring')
    return qs.decode(body)
  } else {
    return body
  }
  */
  return body;
}
