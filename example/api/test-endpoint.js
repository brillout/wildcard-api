const {endpoints} = require('wildcard-api');

// A simple endpoint to test Wildcard
endpoints.mirror = async function(str) {
  const mirrorValue = str && str.split('').reverse().join('');
  return {mirrorValue};
};
