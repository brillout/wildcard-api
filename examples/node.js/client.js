const { server, config } = require("telefunc/client");

config.serverUrl = "http://localhost:3000";

(async () => {
  const randomBit = Math.floor(Math.random() * 2)%2;
  const msg = await server.hello(['visitor','stranger'][randomBit]);
  console.log(msg);
})();
