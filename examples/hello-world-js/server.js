const express = require("express");
const { telefunc } = require("telefunc/server/express");
const vite = require("vite");
const fs = require("fs");

startServer();

async function startServer() {
  const app = express();

  const viteServer = await vite.createServer({
    server: {
      middlewareMode: true,
    },
  });
  app.use(viteServer.middlewares);

  app.use(telefunc());

  const indexHtml = fs.readFileSync("./index.html").toString();
  app.use("*", (_, res) => {
    res.send(indexHtml);
  });

  app.listen(3000);
  console.log("Server running at http://localhost:3000");
}
