const {WildcardClient} = require('./WildcardClient');
const {parse, stringify} = require('./serializer');
const makeHttpRequest = require('./makeHttpRequest');

module.exports = new WildcardClient({makeHttpRequest, stringify, parse});
module.exports.WildcardClient = WildcardClient;
