import * as vite from "vite";
import express = require("express");
import { telefunc } from "telefunc/server/express";
import { setSecretKey } from "telefunc/server";
import { readFileSync } from "fs";

setSecretKey("PODQae!AWUE)(idhwah;)@)*H#D(UH1d21");

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

  const indexHtml = readFileSync(require.resolve("./index.html")).toString();
  app.use("*", (_, res) => {
    res.send(indexHtml);
  });

  const port = 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
