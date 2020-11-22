const { server } = require("telefunc/server");

// A simple endpoint to test Telefunc
server.mirror = async function (str) {
  const mirrorValue = str && str.split("").reverse().join("");
  return { mirrorValue };
};
