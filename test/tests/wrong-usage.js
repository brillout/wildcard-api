module.exports = [
  validUsage1,
  validUsage2,
  endpointReturnsFunction,
  wrongUrl1,
  wrongUrl2,
  wrongUrl3,
  noEndpoints,
  noEndpoints2,
  endpointDoesNotExist,
];

async function validUsage1({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/["Mom"]', {
      method: "POST",
    });
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 200, resp.status);
    assert(text === '"Yo Mom!"', { text });
  });
}

async function validUsage2({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Yo " + name + "!";
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/%5B%22Mom%22%5D", {
      method: "POST",
    });
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 200, resp.status);
    assert(text === '"Yo Mom!"', { text });
  });
}

async function endpointReturnsFunction({
  wildcardApi,
  browserEval,
  assertStderr,
}) {
  wildcardApi.endpoints.fnEndpoint1 = async function () {
    return () => {};
  };

  console.log("before");
  await browserEval(async () => {
    console.log("begin");
    console.error("err1");
    //await new Promise((r) => setTimeout(r, 4000));
    let err;
    try {
      await window.endpoints.fnEndpoint1();
    } catch (_err) {
      err = _err;
    }
    assert(err);
    console.error("err2");
    console.log("end");
  });
  console.log("after");
  console.error("fi er");

  await new Promise((r) => setTimeout(r, 0));
  //await new Promise(r => r());

  assertStderr("bla");
}

async function wrongUrl1({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function () {};

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api//hello");
    const text = await resp.text();
    assert(resp.status === 400, resp.status);
    assert(text.includes("Malformatted API URL `/_wildcard_api//hello`"), {
      text,
    });
    assert(text.includes("API URL should have following format:"), { text });
  });
}

async function wrongUrl2({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/wrongArgSyntax");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 400, resp.status);
    assert(
      text.includes(
        "Malformatted API request `/_wildcard_api/hello/wrongArgSyntax`"
      ),
      { text }
    );
    assert(text.includes("The URL arguments should be a JSON array."), {
      text,
    });
  });
}

async function wrongUrl3({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello/{}");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 400, resp.status);
    assert(
      text.includes("Malformatted API request `/_wildcard_api/hello/{}`"),
      { text }
    );
    assert(text.includes("The URL arguments should be a JSON array."), {
      text,
    });
  });
}

async function noEndpoints({ wildcardApi, browserEval }) {
  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/hello");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `hello` doesn't exist."), { text });
    assert(text.includes("You didn't define any endpoints."), { text });
    assert(
      text.includes("Make sure that the file that defines `hello` is named"),
      { text }
    );
  });
}

async function noEndpoints2({ wildcardApi, wildcardClient }) {
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

async function endpointDoesNotExist({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/blub");
    const text = await resp.text();
    console.log(text);
    assert(resp.status === 404, resp.status);
    assert(text.includes("Endpoint `blub` doesn't exist."), { text });
    assert(!text.includes("You didn't define any endpoints."), { text });
  });
}
