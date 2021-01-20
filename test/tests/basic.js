module.exports = [basic_serverSide, basic_getApiHttpResponse, basic_clientSide];

async function basic_serverSide({ server, telefuncClient }) {
  server.hello = async function (name) {
    return "yo " + name;
  };
  const telefunctionResult = await telefuncClient.telefunctions.hello("Paul");
  assert(telefunctionResult === "yo Paul");
}

async function basic_getApiHttpResponse({ server, telefuncServer }) {
  server.overApi = async function () {
    return "bonjourno!";
  };
  const url = "https://example.org/_telefunc/overApi";
  const method = "POST";
  const headers = {};
  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method,
    headers,
  });
  assert(responseProps.statusCode === 200);
  assert(responseProps.body === `"bonjourno!"`);
}

async function basic_clientSide({ server, browserEval }) {
  server.hello = async function (name) {
    return "Dear " + name;
  };
  await browserEval(async () => {
    const ret = await window.telefunc.server.hello("rom");
    assert(ret === "Dear rom");
  });
}
