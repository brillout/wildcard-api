// Assert HTTP responses

// Telefunc should already return an HTTP response
// - So that the browser-side can handle gracefully using the `isCodeError` flag.
// - The only current exception to this rule is if Telefunc has a bug.
//   - TODO: wrap all Telefunc in a `catch` in order to catch Telefunc bugs.

// HTTP responses that Telefunc can reply:
// - 500 - if telefunction (or context getter, or Telefunc integration code) threw an error
// - 404 - if telefunction doesn't exist
// - 400 - if there is a malformed HTTP request; should never happen if the user uses the Telefunc client

const { setProd, unsetProd } = require("./usage-errors-server");

module.exports = [
  http_validRequest,
  http_endpointMissing_noTelefunctions,
  http_endpointMissing_notDefined,
  http_endpointReturnsUnserializable,
  http_wrongRequest1,
  http_wrongRequest2,
  http_wrongRequest3,
];

async function http_validRequest({ server, browserEval }) {
  server.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_telefunc/hello/["Mom"]', {
      method: "POST",
    });
    const text = await resp.text();
    assert(resp.status === 200, resp.status);
    assert(text === '"Yo Mom!"');
  });
}

async function http_endpointMissing_noTelefunctions({ server, browserEval }) {
  server.nothing = async function () {};

  setProd();
  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/hello");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert.strictEqual(
      text,
      "Telefunction `hello` does not exist. Check the server-side error for more information."
    );
    assert_noErrorStack(text);
  });
  unsetProd();
}

async function http_endpointMissing_notDefined({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  setProd();
  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/blub");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert(
      text ===
        "Telefunction `blub` does not exist. Check the server-side error for more information."
    );
    assert_noErrorStack(text);
  });
  unsetProd();
}

async function http_endpointReturnsUnserializable({
  server,
  browserEval,
  assertStderr,
}) {
  server.fn2 = async function () {
    return async () => {};
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/fn2");
    const text = await resp.text();
    assert(resp.status === 500, resp.status);
    assert(text === "Internal Server Error");
  });

  assertStderr("Couldn't serialize value returned by telefunction `fn2`");
}

async function http_wrongRequest1({ server, browserEval }) {
  server.hello = async function () {};

  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc//hello");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API"));
    assert_noErrorStack(text);
  });
}

async function http_wrongRequest2({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/hello/wrongArgSyntax");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API"));
    assert_noErrorStack(text);
  });
}

async function http_wrongRequest3({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/hello/{}");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API request."));
    assert(
      text.includes(
        "The parsed serialized telefunction arguments should be an array."
      )
    );
    assert_noErrorStack(text);
  });
}
