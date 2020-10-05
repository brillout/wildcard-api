const express = require("express");
const { wildcard } = require("@wildcard-api/server/express");
const { server } = require("@wildcard-api/server");

server.hello = async function () {
  const msg = "Hello from server";
  return msg;
};

const app = express();

app.use(wildcard());
app.listen(3000);
