import express from "express";
import bodyParser from "body-parser";

import { telefunc } from "telefunc/server/express";
import "../endpoints";

const app = express();

app.use(bodyParser.json());
app.use(telefunc(() => ({})));
app.use(express.static("client/dist", { extensions: ["html"] }));

const server = app.listen(3000, () =>
  console.log("Server ready, go to http://localhost:3000")
);
