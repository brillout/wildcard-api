const assert = require('@brillout/assert');

module.exports = {getLoggedUser};

function getLoggedUser(headers) {
  assert(headers.host==='localhost:3000', {headers});
  return {id: 1, username: 'brillout'};
}
