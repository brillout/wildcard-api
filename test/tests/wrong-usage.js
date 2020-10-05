// TODO
// - Returning undefined is ok
// - Arrow endpoint functions not ok
// - Non-async endpoint functions not ok
// - Reading from `server` functions directly without going through Wildcard client

module.exports = [
  noEndpoints1,
  noEndpoints2,
  noEndpoints3,
  endpointDoesNotExist,
  endpointReturnsFunction1,
  endpointReturnsFunction2,

  /* When user enters endpoint URL manually */
  validUrl1,
  validUrl1,
  wrongUrl1,
  wrongUrl2,
  wrongUrl3,
];

async function validUrl1({ server, browserEval }) {
  server.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/["Mom"]', {
      method: "POST",
    });
    const text = await resp.text();
    assert(resp.status === 200, resp.status);
    assert(text === '"Yo Mom!"', { text });
  });
}

async function validUrl2({ server, browserEval }) {
  server.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/%5B%22Mom%22%5D", {
      method: "POST",
    });
    const text = await resp.text();
    assert(resp.status === 200, resp.status);
    assert(text === '"Yo Mom!"', { text });
  });
}

async function wrongUrl1({ server, browserEval }) {
  server.hello = async function () {};

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api//hello");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API"));
  });
}

async function wrongUrl2({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/wrongArgSyntax");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API"));
  });
}

async function wrongUrl3({ server, browserEval }) {
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
  });
}

async function noEndpoints1({ browserEval, assertStderr }) {
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
  // Since the code bug lives on the browser-side
  assertStderr(null);
}
async function noEndpoints2({ wildcardClient, assertStderr }) {
  let err;
  try {
    await wildcardClient.endpoints.helloSsr();
  } catch (_err) {
    err = _err;
  }
  //
  // Contrary to when using the Wilcard Client on the browser-side,
  // we do throw an error on the server-side when
  // using theWildcard Client on the server-side
  assert(err.stack.includes("Endpoint `helloSsr` doesn't exist."));
  assert(err.stack.includes("You didn't define any endpoints."));

  // No collected stderr because we catched the error
  assertStderr(null);
}
async function noEndpoints3({ browserEval }) {
  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `hello` doesn't exist."), { text });
    assert(text.includes("You didn't define any endpoints."), { text });
    assert(
      text.includes("Make sure that the file that defines `hello` is named"),
      { text }
    );
  });
}

async function endpointDoesNotExist({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/blub");
    const text = await resp.text();
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `blub` doesn't exist."), { text });
    assert(!text.includes("You didn't define any endpoints."), { text });
  });
}

async function endpointReturnsFunction1({ server, browserEval, assertStderr }) {
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
  assertStderr("Cannot serialize function `heloFn`");
}

async function endpointReturnsFunction2({ server, browserEval, assertStderr }) {
  server.fnEndpoint2 = async function () {
    return async () => {};
  };

  await browserEval(async () => {
    let err;
    try {
      await server.fnEndpoint2();
    } catch (_err) {
      err = _err;
    }
    assert(err.isCodeError);
    assert(err.message === "Endpoint function `fnEndpoint2` threw an error.");
  });

  assertStderr("Cannot serialize function");
}
