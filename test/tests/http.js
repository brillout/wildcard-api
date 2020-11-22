// Assert HTTP responses

// Wildcard should already return an HTTP response
// - So that the browser-side can handle gracefully using the `isCodeError` flag.
// - The only current exception to this rule is if Wildcard has a bug.
//   - TODO: wrap all Wildcard in a `catch` in order to catch Wildcard bugs.

// HTTP responses that Wildcard can reply:
// - 500 - if endpoint (or context getter, or Wildcard integration code) threw an error
// - 404 - if endpoint doesn't exist
// - 400 - if there is a malformed HTTP request; should never happen if the user uses the Wildcard client

module.exports = [
  http_validRequest,
  http_endpointMissing_noEndpoints,
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

async function http_endpointMissing_noEndpoints({ browserEval }) {
  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/hello");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `hello` doesn't exist."));
    assert(text.includes("You didn't define any endpoints."));
    assert_noErrorStack(text);
  });
}

async function http_endpointMissing_notDefined({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/blub");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `blub` doesn't exist."), { text });
    assert(!text.includes("You didn't define any endpoints."), { text });
    assert_noErrorStack(text);
  });
}

async function http_endpointReturnsUnserializable({
  server,
  browserEval,
  assertStderr,
}) {
  server.fnEndpoint2 = async function () {
    return async () => {};
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_telefunc/fnEndpoint2");
    const text = await resp.text();
    assert(resp.status === 500, resp.status);
    assert(text === "Internal Server Error");
  });

  assertStderr("Couldn't serialize value returned by endpoint `fnEndpoint2`");
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
        "The parsed serialized endpoint arguments should be an array."
      )
    );
    assert_noErrorStack(text);
  });
}
