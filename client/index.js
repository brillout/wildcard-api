const fetch = require('@brillout/fetch');
const {WildcardClient} = require('./WildcardClient');
const stringify = require('@brillout/jpp/stringify');
const parse = require('@brillout/jpp/parse');

const apiClient = new WildcardClient({makeHttpRequest, stringify});

module.exports = apiClient;
module.exports.WildcardClient = WildcardClient;
module.exports.makeHttpRequest = makeHttpRequest;
module.exports.stringify = stringify;

async function makeHttpRequest({url, ...args}) {
  const response = await fetch(
    url,
    {
      method: 'POST',
      credentials: 'same-origin',
      ...args
    }
  );
  const body = await response.text();
  return parse(body);
}
