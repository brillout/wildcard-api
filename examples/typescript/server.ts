import express = require("express");
import { telefunc } from "telefunc/server/express";
import { setSecretKey } from "telefunc/server";

setSecretKey("PODQae!90911dw;)@)*H#D(UH1d21");

const app = express();

// Serve telefunctions
app.use(telefunc());

// Serve index.html
app.use(express.static("dist/", { extensions: ["html"] }));

app.listen(3000);

console.log("Express server is running, go to http://localhost:3000");
