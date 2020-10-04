const { wildcard } = require("@wildcard-api/client");
const { endpoints } = require("@wildcard-api/client");

wildcard.serverUrl = "http://localhost:3000";

(async () => {
  const msg = await endpoints.hello();
  console.log(msg);
})();
