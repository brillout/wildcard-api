const express = require("express");
const { telefunc } = require("telefunc/server/express");

const app = express();

// Server our telefunctions
app.use(
  telefunc(async (req) => {
    const { headers } = req;
    const context = { headers };
    return context;
  })
);

// Serve our frontend
app.use(express.static("client/dist", { extensions: ["html"] }));

app.listen(3000);

console.log("Express server is running, go to http://localhost:3000");
