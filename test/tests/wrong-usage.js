// TODO
// - Returning undefined is ok
// - Arrow endpoint functions not ok
// - Non-async endpoint functions not ok

module.exports = [
  validUsage1,
  validUsage2,
  wrongUrl1,
  wrongUrl2,
  wrongUrl3,
  noEndpoints,
  noEndpoints2,
  endpointDoesNotExist,
  endpointReturnsFunction1,
  endpointReturnsFunction2,
];

async function validUsage1({ server, browserEval }) {
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

async function validUsage2({ server, browserEval }) {
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
    assert(text.includes("Malformatted API"));
    assert(text.includes("The URL arguments should be an array."));
  });
}

async function noEndpoints({ browserEval }) {
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

async function noEndpoints2({ wildcardClient }) {
  let errorThrown = false;
  try {
    await wildcardClient.endpoints.helloSsr();
  } catch (err) {
    errorThrown = true;
    assert(err.stack.includes("Endpoint `helloSsr` doesn't exist."), err.stack);
    assert(err.stack.includes("You didn't define any endpoints."), err.stack);
    assert(
      err.stack.includes(
        "Make sure that the file that defines `helloSsr` is named"
      ),
      err.stack
    );
  }
  assert(errorThrown === true);
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
    return function heloFn() {}; //() => {};
  };

  await browserEval(async () => {
    let err;
    try {
      await server.fnEndpoint1();
    } catch (_err) {
      err = _err;
    }
    assert(err.message === "Internal Server Error");
  });

  assertStderr(
    "Couldn't serialize value returned by endpoint function `fnEndpoint1`",
    "Cannot serialize function `heloFn`"
  );
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
    assert(err.message === "Internal Server Error");
  });

  assertStderr("Cannot serialize function");
}
