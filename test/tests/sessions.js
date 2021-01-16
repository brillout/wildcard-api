const { createServer } = require("./details");

module.exports = [
  contextChange_getApiHttpResponse,
  contextChange,
  canGetContextOutsideOfTelefunc,
  contextInterfaceIsIsomorphic,
];

async function contextChange_getApiHttpResponse({
  telefuncServer,
  server,
  context,
  setSecretKey,
}) {
  setSecretKey("uihewqiehqiuehuaheliuhawiulehqchbas");

  server.withContextChange = function () {
    context.userName = "brillout";
  };

  const url = "https://example.org/_telefunc/withContextChange";
  const method = "POST";

  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method,
    headers: {},
  });
  assert(responseProps.statusCode === 200);
  assert(responseProps.body === `"!undefined"`);
  assert(responseProps.headers["Set-Cookie"]);
  assert(
    responseProps.headers["Set-Cookie"][0] ===
      "telefunc_userName=%22brillout%22; Max-Age=315360000; Path=/"
  );
  assert(
    responseProps.headers["Set-Cookie"][1] ===
      "telefunc-signature_userName=805a7267a154c24ef1833704ca4f04aba13f8a6bd96c61e6b7419cf8ee72f316; Max-Age=315360000; Path=/; HttpOnly"
  );
}

async function contextChange({ server, context, browserEval, setSecretKey }) {
  setSecretKey("quieahbcqbohiawlubcsbi*&@381y87wqiwdhawbl");

  server.login = async function (name) {
    context.user = name;
  };
  server.whoAmI = async function () {
    return "You are: " + context.user;
  };
  await browserEval(async () => {
    // Removing an non-existing context won't choke
    assert(window.telefunc.context.user === undefined);
    delete window.telefunc.context.user;
    assert(window.telefunc.context.user === undefined);

    const ret1 = await window.telefunc.server.whoAmI();
    assert(window.telefunc.context.user === undefined);
    assert(ret1 === "You are: undefined");

    await window.telefunc.server.login("rom");

    assert(window.telefunc.context.user === "rom");
    const ret2 = await window.telefunc.server.whoAmI();
    assert(ret2 === "You are: rom");

    // Removing an already removed context won't choke
    assert(window.telefunc.context.user !== undefined);
    delete window.telefunc.context.user;
    assert(window.telefunc.context.user === undefined);
    delete window.telefunc.context.user;
    assert(window.telefunc.context.user === undefined);
  });
}

canGetContextOutsideOfTelefunc.isIntegrationTest = true;
async function canGetContextOutsideOfTelefunc({ browserEval, ...args }) {
  const {
    stopApp,
    server,
    app,
    telefuncServer: { setSecretKey, context },
  } = await createServer(args);

  setSecretKey("ueqwhiue128e8199quiIQUU(*@@1dwq");

  server.login = async function (name) {
    context.myName = name;
  };
  server.tellMyName = async function () {
    return "You are: " + context.myName;
  };
  app.get("/some-express-route", (_, res) => {
    res.send("Hello darling " + context.myName);
  });

  await browserEval(async () => {
    assert(window.telefunc.context.myName === undefined);
    assert((await window.telefunc.server.tellMyName()) === "You are: undefined");
    assert((await callCustomRoute()) === "Hello darling undefined");

    await window.telefunc.server.login("romBitch");

    assert(window.telefunc.context.myName === "romBitch");
    assert((await window.telefunc.server.tellMyName()) === "You are: romBitch");
    assert((await callCustomRoute()) === "Hello darling romBitch");

    return;

    async function callCustomRoute() {
      const resp = await window.fetch("/some-express-route");
      assert(resp.status === 200, resp.status);
      const text = await resp.text();
      return text;
    }
  });

  await stopApp();
}

contextInterfaceIsIsomorphic.isIntegrationTest = true;
async function contextInterfaceIsIsomorphic({
  browserEval,
  httpPort,
  staticDir,
}) {
  const express = require("express");
  const { telefunc } = require("telefunc/server/express");
  const { stop, start } = require("../setup/servers/express");

  const app = express();
  app.use(express.json());
  app.use(express.static(staticDir, { extensions: ["html"] }));
  app.use(telefunc());

  const appServer = await start(app, httpPort);

  // We are importing `context` from the client module instead of the server module
  const { context } = require("telefunc/client");
  // This is (and should be) the only test that uses the global TelefuncServer instance.
  const { server, setSecretKey } = require("telefunc/server");

  setSecretKey("uhe1h20189HODH@(*H9e81hd9");

  server.login = async function (name) {
    context.user = name;
  };
  server.myName = async function () {
    return "name: " + context.user;
  };
  await browserEval(async () => {
    await window.telefunc.server.login("romli");
    assert((await window.telefunc.server.myName()) === "name: romli");
    assert(window.telefunc.context.user === "romli");
  });

  {
    let err;
    try {
      context.user;
    } catch (_err) {
      err = _err;
    }
    assert(
      err.message ===
        "[Telefunc][Wrong Usage] You are trying to access the context `context.user` outside the lifetime of an HTTP request. Context is only available wihtin the lifetime of an HTTP request; make sure to read `context.user` *after* Node.js received the HTTP request and *before* the HTTP response has been sent."
    );
  }

  await stop(appServer);
}
