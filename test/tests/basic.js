module.exports = [
  basic_serverSide,
  basic_getApiHttpResponse,
  basic_serverSide_withContext,
  basic_clientSide,
  basic_clientSide_withContext,
];

async function basic_serverSide({ server, telefuncClient }) {
  server.hello = async function (name) {
    return "yo " + name;
  };
  const endpointResult = await telefuncClient.endpoints.hello("Paul");
  assert(endpointResult === "yo Paul");
}

async function basic_getApiHttpResponse({ server, telefuncServer }) {
  server.overApi = async function () {
    return "bonjourno!";
  };
  const url = "https://example.org/_telefunc/overApi";
  const method = "POST";
  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method,
  });
  assert(responseProps.statusCode === 200);
  assert(responseProps.body === `"bonjourno!"`);
}

async function basic_serverSide_withContext({ server, telefuncClient }) {
  const headers = [];
  server.hello = async function (name) {
    assert(this.headers === headers);
    return "heyy " + name;
  };
  const endpointResult = await telefuncClient.endpoints.hello.bind({ headers })(
    "Paul"
  );
  assert(endpointResult === "heyy Paul");
}

async function basic_clientSide({ server, browserEval }) {
  server.hello = async function (name) {
    return "Dear " + name;
  };
  await browserEval(async () => {
    const ret = await window.server.hello("rom");
    assert(ret === "Dear rom");
  });
}

async function basic_clientSide_withContext({ server, browserEval }) {
  server.hello = async function (name) {
    assert(this.headers.host.startsWith("localhost"));
    assert(this.headers["user-agent"].includes("HeadlessChrome"));
    return "Servus " + name;
  };
  await browserEval(async () => {
    const ret = await window.server.hello("Romuald");
    assert(ret === "Servus Romuald");
  });
}
