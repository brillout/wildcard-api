import express from "express";
import { telefunc } from "telefunc/server/express";
import "./main.telefunc";

const app = express();

// Serve telefunctions
app.use(telefunc());

// Serve static assets
app.use(express.static("client/dist", { extensions: ["html"] }));

app.listen(3000);

console.log("Express server is running, go to http://localhost:3000");
