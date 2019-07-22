const {endpoints} = require('wildcard-api');

// A simple endpoint to test Wildcard
endpoints.hello = async function(str) {
  return {'mirror': str};
};
