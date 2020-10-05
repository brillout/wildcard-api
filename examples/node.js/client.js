const { server, config } = require("@wildcard-api/client");

config.serverUrl = "http://localhost:3000";

(async () => {
  const msg = await server.hello();
  console.log(msg);
})();
