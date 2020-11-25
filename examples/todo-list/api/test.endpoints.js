const { server, setSecretKey } = require("telefunc/server");

// A simple endpoint to test Telefunc
server.mirror = async function (str) {
  const mirrorValue = str && str.split("").reverse().join("");
  return { mirrorValue };
};

// Simple endpoints to test reading/writing the context
setSecretKey("iuhwdbp2899d742h834fwh*(@huDqwuhd");
server.login = function (username) {
  this.username = username;
};
server.whoAmI = function () {
  return "You are: " + this.username;
};
