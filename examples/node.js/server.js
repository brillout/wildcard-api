const express = require("express");
const { telefunc } = require("telefunc/server/express");
const { server } = require("telefunc/server");

server.hello = async function () {
  const msg = "Hello from server";
  return msg;
};

const app = express();

app.use(telefunc());
app.listen(3000);
