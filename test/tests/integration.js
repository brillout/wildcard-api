module.exports = [
  // `getApiHttpResponse` returns null for non-telefunc HTTP requests
  doesntIntefere1,
  // Telefunc server middlewares don't intefere with non-telefunc HTTP requests
  doesntIntefere2,
  // Ensure that the Wilcard client on unpkg.com works
  unpkg,
  // Ensure that the API is as described in the docs.
  API,
  // Assert thrown error message when trying to `require("telefunc")`
  mainImportForbidden,
];

async function doesntIntefere1({ server, telefuncServer }) {
  server.getme = function () {
    return "you got me";
  };
  {
    const responseProps = await telefuncServer.getApiHttpResponse({
      method: "POST",
      url: "/_telefuncc",
      headers: {},
    });
    assert(responseProps === null);
  }
  {
    const responseProps = await telefuncServer.getApiHttpResponse({
      method: "POST",
      url: "/_telefunc/getme",
      headers: {},
    });
    assert(responseProps.body === `"you got me"`);
  }
}

async function doesntIntefere2({ server, browserEval }) {
  server.myTelefunction = async function () {
    return "Grüß di";
  };

  await browserEval(async () => {
    const resp1 = await window.fetch("/hey-before", {
      method: "GET",
    });
    assert(resp1.status === 200);
    const text1 = await resp1.text();
    assert(text1 === "Hello darling");

    const telefunctionRet = await window.telefunc.server.myTelefunction();
    assert(telefunctionRet === "Grüß di");

    const resp2 = await window.fetch("/hey/after", {
      method: "POST",
    });
    assert(resp2.status === 200);
    const text2 = await resp2.text();
    assert(text2 === "Hello again");
  });
}

// Playground: https://jsfiddle.net/bj4sLdh1/1/
async function unpkg({ server, browserEval }) {
  let telefunctionCalled = false;
  server.bonj = async function () {
    telefunctionCalled = true;
    return "Bonjour";
  };

  await browserEval(async () => {
    preserveState_1();

    assert(!window.telefunc);
    await loadScript("https://unpkg.com/telefunc/umd/telefunc-client.min.js");
    assert(window.telefunc);
    const ret = await window.telefunc.server.bonj();
    assert(ret === "Bonjour");
    assert_api();
    delete window.telefunc;

    preserveState_2();

    function assert_api() {
      assert(window.telefunc.server);
      assert(window.telefunc.config);
      assert(window.telefunc.context);
      assert(window.telefunc.TelefuncError);
      assert(Object.keys(window.telefunc).length === 4);
    }

    function preserveState_1() {
      assert(window.telefunc);
      window.telefunc_original = window.telefunc;
      delete window.telefunc;
    }
    function preserveState_2() {
      assert(!window.telefunc);
      window.telefunc = window.telefunc_original;
      delete window.telefunc_original;
      assert(window.telefunc);
    }
    async function loadScript(url) {
      const script = window.document.createElement("script");

      let resolve;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      script.onload = resolve;
      script.onerror = reject;

      script.src = url;

      window.document.head.appendChild(script);

      return promise;
    }
  });

  assert(telefunctionCalled);
}

async function API({ browserEval }) {
  const telefunc_context = require("telefunc/context");
  assert(telefunc_context.context.constructor === Object);
  assert(Object.keys(telefunc_context).length === 1);

  const telefunc_server = require("telefunc/server");
  // 1
  assert(telefunc_server.server.constructor === Object);
  // 2
  assert(telefunc_server.config.constructor === Object);
  // 3
  assert(telefunc_server.getApiHttpResponse);
  assert(
    telefunc_server.getApiHttpResponse.constructor.name === "AsyncFunction"
  );
  // 4
  assert(telefunc_server.setSecretKey);
  // 4===4
  assert(Object.keys(telefunc_server).length === 4);

  const telefunc_client = require("telefunc/client");
  assert(telefunc_client.server);
  assert(telefunc_client.config);
  assert(telefunc_client.TelefuncError);
  assert(Object.keys(telefunc_client).length === 3);

  ["express", "koa", "hapi"].forEach((serverFramework) => {
    const export_ = require("telefunc/server/" + serverFramework);
    assert(export_.telefunc.name === "telefunc");
    assert(export_.telefunc.constructor.name === "Function");
    assert(Object.keys(export_).length === 1);
  });

  await browserEval(async () => {
    assert(window.telefunc.server);
    assert(window.telefunc.config);
    assert(window.telefunc.context);
    assert(window.telefunc.TelefuncError);
    assert(Object.keys(window.telefunc).length === 4);
  });
}

async function mainImportForbidden() {
  try {
    require("telefunc");
  } catch (err) {
    assert(
      err.message ===
        '[Telefunc][Wrong Usage] You cannot `require("telefunc")`/`import * from "telefunc"`. Either `require("telefunc/client")`/`import * from "telefunc/client"` or `require("telefunc/server")`/`import * from "telefunc/server"` instead.'
    );
  }
}
