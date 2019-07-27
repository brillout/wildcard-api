const {endpoints} = require('wildcard-api');

// A simple endpoint to test Wildcard
endpoints.mirror = async function(str) {
  return {'mirror': str};
};
