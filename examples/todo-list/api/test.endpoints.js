const { server } = require("telefunc/server");

// A simple endpoint to test Wildcard
server.mirror = async function (str) {
  const mirrorValue = str && str.split("").reverse().join("");
  return { mirrorValue };
};
