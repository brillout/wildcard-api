const {getApiResponse} = require('wildcard-api');
const assert = require('@brillout/reassert');

module.exports = universalRequestHandler;

async function universalRequestHandler(requestObject) {
  const {url, method, body} = requestObject;
  assert.internal(url.startsWith('http'), {url});
  assert.internal(method.constructor===String);
  assert.internal(body===null || body.constructor===String);

  const apiResponse = await getApiResponse(requestObject);
  assert.internal(Object.keys(apiResponse).length===3);
  assert.internal('statusCode' in apiResponse);
  assert.internal('contentType' in apiResponse);
  assert.internal('body' in apiResponse);

  const {statusCode, contentType, body} = apiResponse;
  return {statusCode, contentType, body};
}
