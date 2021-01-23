const Koa = require("koa");
const Static = require("koa-static");
const { telefunc } = require("telefunc/server/koa");

const app = new Koa();

// Serve telefunctions
app.use(telefunc());

// Serve index.html
app.use(Static("./browser/dist/", { extensions: [".html"] }));

app.listen(3000);

console.log("Koa server is running, go to http://localhost:3000");
