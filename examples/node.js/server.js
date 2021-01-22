const express = require("express");
const { telefunc } = require("telefunc/server/express");
const { server } = require("telefunc/server");

server.hello = (name) => `Hello ${name}, from server.`;

const app = express();
app.use(telefunc());
app.listen(3000);
console.log("Server running at http://localhost:3000");
