// TODO
// - Returning undefined is ok
// - Arrow endpoint functions not ok
// - Non-async endpoint functions not ok
// - Reading from `server` functions directly without going through Wildcard client
// - All `assertUsage`

module.exports = [
  endpointMissing_noEndpoints_serverSide,
  endpointMissing_noEndpoints_clientSide,
  endpointMissing_noEndpoints_httpRequest,
  endpointMissing_notDefined_httpRequest,

  endpointReturnsFunction,
  endpointReturnsFunction_httpRequest,

  endpointThrowsError,

  wrongUsage_getApiHttpResponse_1,
  wrongUsage_getApiHttpResponse_2,
  wrongUsage_getApiHttpResponse_3,
  wrongUsage_getApiHttpResponse_4,
  wrongUsage_getApiHttpResponse_5,

  wrongHttpRequest1,
  wrongHttpRequest2,
  wrongHttpRequest3,

  validRequest_httpStatusCode,
];

async function endpointMissing_noEndpoints_serverSide({
  wildcardClient,
  assertStderr,
}) {
  let err;
  try {
    await wildcardClient.endpoints.helloSsr();
  } catch (_err) {
    err = _err;
  }

  // Contrary to when using the Wilcard Client on the browser-side,
  // we do throw an error on the server-side when
  // using theWildcard Client on the server-side
  assert(err.stack.includes("Endpoint `helloSsr` doesn't exist."));
  assert(err.stack.includes("You didn't define any endpoints."));

  // No collected stderr because we catched the error
  assertStderr(null);
}

async function endpointMissing_noEndpoints_clientSide({
  browserEval,
  assertStderr,
}) {
  await browserEval(async () => {
    let err;
    try {
      await window.server.iDoNotExist({ some: 42, arg: "rom" });
    } catch (_err) {
      err = _err;
    }
    assert(err.message === "Endpoint `iDoNotExist` does not exist.");
    assert(err.isCodeError);
  });

  // We don't throw any error on the server-side
  // Since the bug lives in browser-side code
  // To avoid malintentioned flooding of server error logs
  assertStderr(null);
}

async function endpointMissing_noEndpoints_httpRequest({ browserEval }) {
  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `hello` doesn't exist."));
    assert(text.includes("You didn't define any endpoints."));
    assert_noErrorStack(text);
  });
}

async function endpointMissing_notDefined_httpRequest({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/blub");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `blub` doesn't exist."), { text });
    assert(!text.includes("You didn't define any endpoints."), { text });
    assert_noErrorStack(text);
  });
}

async function endpointReturnsFunction({ server, browserEval, assertStderr }) {
  server.fnEndpoint1 = async function () {
    return function heloFn() {};
  };

  await browserEval(async () => {
    let err;
    try {
      await server.fnEndpoint1();
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError);
    assert(err.message === "Endpoint function `fnEndpoint1` threw an error.");
  });

  assertStderr("Couldn't serialize value returned by endpoint `fnEndpoint1`");
}

async function endpointReturnsFunction_httpRequest({
  server,
  browserEval,
  assertStderr,
}) {
  server.fnEndpoint2 = async function () {
    return async () => {};
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/fnEndpoint2");
    const text = await resp.text();
    assert(resp.status === 500, resp.status);
    assert(text === "Internal Server Error");
  });

  assertStderr("Couldn't serialize value returned by endpoint `fnEndpoint2`");
}

async function endpointThrowsError({ server, browserEval, assertStderr }) {
  const errorText = "oh-oh-error" + Math.random();

  server.aintWorking = async function () {
    throw new Error(errorText);
  };

  await browserEval(async () => {
    let err;
    try {
      await server.aintWorking();
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError);
    assert(err.message === "Endpoint function `aintWorking` threw an error.");
  });

  assertStderr(errorText);
}

async function wrongUsage_getApiHttpResponse_1({
  wildcardServer,
  assertStderr,
}) {
  const responseProps = await wildcardServer.getApiHttpResponse();
  assertErrorResponse(responseProps);
  assertStderr("Missing arguments `url` and `method`");
}
async function wrongUsage_getApiHttpResponse_2({
  wildcardServer,
  assertStderr,
}) {
  const responseProps = await wildcardServer.getApiHttpResponse({
    method: "post",
  });
  assertErrorResponse(responseProps);
  assertStderr("Missing argument `url`");
}
async function wrongUsage_getApiHttpResponse_3({
  wildcardServer,
  assertStderr,
}) {
  const url = "https://example.org/_wildcard_api/ummm";
  const responseProps = await wildcardServer.getApiHttpResponse({ url });
  assertErrorResponse(responseProps);
  assertStderr("Missing argument `method`");
}
async function wrongUsage_getApiHttpResponse_4({
  wildcardServer,
  assertStderr,
}) {
  const url = "https://example.org/_wildcard_api/ummm";
  const method = "PUT";
  const responseProps = await wildcardServer.getApiHttpResponse({
    url,
    method,
  });
  assertErrorResponse(responseProps);
  assertStderr('method must be one of ["POST", "GET", "post", "get"]');
}
async function wrongUsage_getApiHttpResponse_5({
  wildcardServer,
  assertStderr,
}) {
  const url = "https://example.org/_wildcard_api/ummm";
  const method = "GET";
  const context = null;
  const responseProps = await wildcardServer.getApiHttpResponse(
    { url, method },
    context
  );
  assertErrorResponse(responseProps);
  assertStderr("`context` should be an object(-like) or `undefined`.");
}
function assertErrorResponse(responseProps) {
  assert(responseProps.body === "Internal Server Error");
  assert(responseProps.statusCode === 500);
  assert(responseProps.contentType === "text/plain");
  assert(Object.keys(responseProps).length === 3);
}

async function wrongHttpRequest1({ server, browserEval }) {
  server.hello = async function () {};

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api//hello");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API"));
    assert_noErrorStack(text);
  });
}

async function wrongHttpRequest2({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/wrongArgSyntax");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API"));
    assert_noErrorStack(text);
  });
}

async function wrongHttpRequest3({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/{}");
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

async function validRequest_httpStatusCode({ server, browserEval }) {
  server.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/["Mom"]', {
      method: "POST",
    });
    const text = await resp.text();
    assert(resp.status === 200, resp.status);
    assert(text === '"Yo Mom!"');
  });
}
