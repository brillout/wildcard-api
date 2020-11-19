import express from "express";
import { wildcard } from "telefunc/server/express";
import "./endpoints.ts";
import { Context } from "./context";

const app = express();

// Server our API endpoints
app.use(
  wildcard(() => {
    const context: Context = { isLoggedIn: true };
    return context;
  })
);

// Serve our frontend
app.use(express.static("client/dist", { extensions: ["html"] }));

app.listen(3000);

console.log("Express server is running, go to http://localhost:3000");
