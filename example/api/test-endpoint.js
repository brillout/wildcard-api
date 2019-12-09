const {endpoints} = require('@wildcard-api/server');

// A simple endpoint to test Wildcard
endpoints.mirror = async function(str) {
  const mirrorValue = str && str.split('').reverse().join('');
  return {mirrorValue};
};
