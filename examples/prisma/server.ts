import express = require("express");
import { telefunc } from "telefunc/server/express";
import { seed } from "./database/seed";

startServer();

async function startServer() {
  const app = express();

  app.use(telefunc());
  app.use(express.static("dist/", { extensions: ["html"] }));

  await seed();

  app.listen(3000, () =>
    console.log("Server ready, go to http://localhost:3000")
  );
}
