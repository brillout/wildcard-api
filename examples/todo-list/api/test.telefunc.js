const { server, context, setSecretKey } = require("telefunc/server");

// A simple telefunction to test Telefunc
server.mirror = async function (str) {
  const mirrorValue = str && str.split("").reverse().join("");
  return { mirrorValue };
};

// Simple telefunctions to test reading/writing the context
setSecretKey("iuhwdbp2899d742h834fwh*(@huDqwuhd");
server.login = function (username) {
  context.username = username;
};
server.whoAmI = function () {
  return "You are: " + context.username;
};
