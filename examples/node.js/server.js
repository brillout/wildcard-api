const express = require("express");
const { wildcard } = require("telefunc/server/express");
const { server } = require("telefunc/server");

server.hello = async function () {
  const msg = "Hello from server";
  return msg;
};

const app = express();

app.use(wildcard());
app.listen(3000);
