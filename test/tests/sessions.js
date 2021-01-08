const { createServer } = require("./details");

module.exports = [
  contextChange_getApiHttpResponse,
  contextChange,
  canGetContextOutsideOfTelefunc,
  contextBrowserOnly,
];

async function contextChange_getApiHttpResponse({
  telefuncServer,
  server,
  setSecretKey,
}) {
  setSecretKey("uihewqiehqiuehuaheliuhawiulehqchbas");

  server.withContextChange = function () {
    this.userName = "brillout";
  };

  const url = "https://example.org/_telefunc/withContextChange";
  const method = "POST";

  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method,
    headers: {},
  });
  assert(responseProps.statusCode === 200);
  assert(responseProps.body === `"json-s:tYpE|undefined"`);
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

async function contextChange({
  server,
  browserEval,
  setSecretKey,
  telefuncServer,
}) {
  setSecretKey("quieahbcqbohiawlubcsbi*&@381y87wqiwdhawbl");

  server.login = async function (name) {
    const context = telefuncServer.getContext();
    context.user = name;
    // this.user = name;
  };
  server.whoAmI = async function () {
    return "You are: " + this.user;
  };
  await browserEval(async () => {
    // Removing an non-existing context won't choke
    delete window.telefuncClient.context.user;
    assert(window.telefuncClient.context.user === undefined);

    const ret1 = await window.server.whoAmI();
    assert(window.telefuncClient.context.user === undefined);
    assert(ret1 === "You are: undefined");

    await window.server.login("rom");

    assert(window.telefuncClient.context.user === "rom");
    const ret2 = await window.server.whoAmI();
    assert(ret2 === "You are: rom");

    // Cleanup to make this test idempotent
    delete window.telefuncClient.context.user;
    assert(window.telefuncClient.context.user === undefined);

    // Removing an already removed context won't choke
    delete window.telefuncClient.context.user;
    assert(window.telefuncClient.context.user === undefined);
  });
}

canGetContextOutsideOfTelefunc.isIntegrationTest = true;
async function canGetContextOutsideOfTelefunc({ browserEval, ...args }) {
  const {
    stopApp,
    server,
    app,
    telefuncServer: { setSecretKey, getContextFromCookie },
  } = await createServer(args);

  {
    let secretMissingError;
    try {
      getContextFromCookie("fake-cookie=123;");
    } catch (err) {
      secretMissingError = err;
    }
    assert(
      secretMissingError.message.includes(
        "`setSecretKey()` needs to be called before calling `getContextFromCookie()`."
      )
    );
    delete secretMissingError;
  }

  setSecretKey("0123456789");

  {
    const ctx = getContextFromCookie();
    assert(ctx.constructor === Object && Object.keys(ctx).length === 0);
  }

  {
    const ctx = getContextFromCookie("fake=321");
    assert(ctx.constructor === Object && Object.keys(ctx).length === 0);
  }

  {
    let cookieMissing;
    try {
      getContextFromCookie({ cookie: "fake-cookie=123;" });
    } catch (err) {
      cookieMissing = err;
    }
    assert(
      cookieMissing.message.includes(
        "[Wrong Usage] `getContextFromCookie(cookie)`: `cookie` should be a string"
      )
    );
  }

  server.login = async function (name) {
    this.user = name;
  };

  app.get("/not-telefunc-endpoint", (req, res) => {
    const context = getContextFromCookie(req.headers.cookie);
    assert(context.user === "romi");
    assert(Object.keys(context).length === 1);
    res.send("Greeting, darling " + context.user);
  });

  await browserEval(async () => {
    assert(window.telefuncClient.context.user === undefined);
    await window.server.login("romi");
    assert(window.telefuncClient.context.user === "romi");

    const resp = await window.fetch("/not-telefunc-endpoint");
    const text = await resp.text();
    assert(text === "Greeting, darling romi");

    // Cleanup to make this test idempotent
    delete window.telefuncClient.context.user;
  });

  await stopApp();
}

async function contextBrowserOnly({ browserEval, server, setSecretKey }) {
  setSecretKey(".................");

  server.login = async function (name) {
    this.user = name;
  };
  await browserEval(async () => {
    await window.server.login("romli");
  });

  // `const { context } import "telefunc/client"` doesn't work in Node.js
  const { context } = require("telefunc/client");
  let contextErr;
  try {
    context.user;
  } catch (err) {
    contextErr = err;
  }
  assert(
    contextErr.message.includes(
      'The context object `import { context } from "telefunc/client"` is available only in the browser. You seem to try to use it in Node.js. Consider using `import { getContextFromCookie } from "telefunc/server"` instead.'
    )
  );

  // `const { context } import "telefunc/client"` does however work in the browser
  await browserEval(async () => {
    assert(window.telefuncClient.context.user === "romli");
    // Cleanup to make this test idempotent
    delete window.telefuncClient.context.user;
  });
}
