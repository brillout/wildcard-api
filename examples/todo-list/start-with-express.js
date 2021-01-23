const express = require("express");
const { telefunc } = require("telefunc/server/express");

const app = express();

// Serve telefunctions
app.use(telefunc());

// Serve index.html
app.use(express.static("./browser/dist/", { extensions: ["html"] }));

app.listen(3000);

console.log("Express server is running, go to http://localhost:3000");
