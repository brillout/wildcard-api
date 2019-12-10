const crypto = require('crypto');

module.exports = computeEtag;

function computeEtag(body) {
  if (body.length === 0) {
    // fast-path empty body
    return '1B2M2Y8AsgTpgAmY7PhCfg==';
  }

  return (
    crypto
    .createHash('md5')
    .update(body, 'utf8')
    .digest('base64')
  );
}
