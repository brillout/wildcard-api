const { createServer } = require("./details");
const cookieLibrary = require("cookie");

module.exports = [
  contextChange_getApiHttpResponse,
  contextChange,
  canGetContextOutsideOfTelefunc,
  cannotGetContextOutsideRequest,
  brokenSignature,
  wrongSecretKey,
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
    assert(
      (await window.telefunc.server.tellMyName()) === "You are: undefined"
    );
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

async function cannotGetContextOutsideRequest({ context }) {
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

brokenSignature.isIntegrationTest = true;
async function brokenSignature({ browserEval, ...args }) {
  await runTest("2209hUWDLH@@@H@9e1p0hawdhUHW", { isSecondRun: false });

  // We can change the secret key and Telefunc won't choke
  await runTest("92IAuahew(@(U)aaeaaaad!!!)_", { isSecondRun: true });

  return;
  async function runTest(secretKey, { isSecondRun }) {
    const {
      stopApp,
      server,
      app,
      telefuncServer: { setSecretKey, context },
    } = await createServer(args);

    setSecretKey(secretKey);
    server.login = async function (name) {
      context.user = name;
    };
    server.whoAmI = async function () {
      return "You are: " + context.user;
    };

    const signatureCookieName = "telefunc-signature_user";
    app.get("/break-signature", (req, res) => {
      const cookieValues = cookieLibrary.parse(req.headers.cookie);
      const signatureCookieValue = cookieValues[signatureCookieName];
      const newCookieValue = cookieLibrary.serialize(
        signatureCookieName,
        signatureCookieValue + "-corrupt"
      );
      res.set("Set-Cookie", newCookieValue);
      res.send();
    });
    app.get("/remove-signature", (req, res) => {
      const newCookieValue = cookieLibrary.serialize(
        signatureCookieName,
        undefined
      );
      res.set("Set-Cookie", newCookieValue);
      res.send();
    });
    app.get("/fake-signature", (req, res) => {
      const newCookieValue = cookieLibrary.serialize(
        signatureCookieName,
        "abc"
      );
      res.set("Set-Cookie", newCookieValue);
      res.send();
    });

    await browserEval(
      async ({ isSecondRun }) => {
        if (isSecondRun) {
          assert(document.cookie === "telefunc_user=%22rom%22");
          // The cookie signature is broken: it was set by the previous run which
          // had a different secret key. Telefunc won't choke.
          assert(
            (await window.telefunc.server.whoAmI()) === "You are: undefined"
          );
        }

        assert(
          (await window.telefunc.server.whoAmI()) === "You are: undefined"
        );
        await window.telefunc.server.login("rom");
        assert((await window.telefunc.server.whoAmI()) === "You are: rom");

        {
          const cookieName = "telefunc_user";
          let cookieValues = window.cookieLibrary.parse(window.document.cookie);
          assert(Object.keys(cookieValues).length === 1);
          assert(cookieValues[cookieName] === '"rom"');

          window.deleteAllCookies();
          assert(document.cookie === "");
          assert(
            (await window.telefunc.server.whoAmI()) === "You are: undefined"
          );

          const cookieNameFake = cookieName + "fake";
          document.cookie = window.cookieLibrary.serialize(
            cookieNameFake,
            '"rombi"'
          );
          assert(document.cookie === "telefunc_userfake=%22rombi%22");
          cookieValues = window.cookieLibrary.parse(window.document.cookie);
          assert(cookieValues[cookieNameFake] === '"rombi"');
          assert(Object.keys(cookieValues).length === 1);
          assert(
            (await window.telefunc.server.whoAmI()) === "You are: undefined"
          );

          window.deleteAllCookies();
          assert(document.cookie === "");
          assert(
            (await window.telefunc.server.whoAmI()) === "You are: undefined"
          );

          await window.telefunc.server.login("rom");
          assert((await window.telefunc.server.whoAmI()) === "You are: rom");
        }

        await window.fetch("/break-signature");
        assert(
          (await window.telefunc.server.whoAmI()) === "You are: undefined"
        );

        // Broken signature can be fixed
        await window.telefunc.server.login("rom");
        assert((await window.telefunc.server.whoAmI()) === "You are: rom");

        await window.fetch("/remove-signature");
        assert(
          (await window.telefunc.server.whoAmI()) === "You are: undefined"
        );

        await window.telefunc.server.login("rom");
        assert((await window.telefunc.server.whoAmI()) === "You are: rom");
      },
      { browserArgs: { isSecondRun } }
    );

    await stopApp();
  }
}

async function wrongSecretKey({ setSecretKey }) {
  [undefined, null, 123, "123456789"].forEach((secretKey) => {
    let err;
    try {
      setSecretKey(secretKey);
    } catch (_err) {
      err = _err;
    }
    assert(
      err.message ===
        "[Telefunc][Wrong Usage] `setSecretKey(secretKey)`: Argument `secretKey` should be a string with a length of at least 10 characters."
    );
  });

  const validKey = "1234567890";
  setSecretKey(validKey);
  let err;
  try {
    setSecretKey(validKey);
  } catch (_err) {
    err = _err;
  }
  assert.strictEqual(
    err.message,
    "[Telefunc][Wrong Usage] `setSecretKey()` should be called only once."
  );
}
