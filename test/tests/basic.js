module.exports = [
  basic_serverSideUse,
  basic_clientSideUse,
  basic_clientSideUse_requestObjectIsAvailbe,
  basic_serverSideUse_withoutRequestProps,
];

async function basic_clientSideUse({ server, browserEval }) {
  server.hello = async function (name) {
    return "Dear " + name;
  };

  await browserEval(async () => {
    const ret = await window.server.hello("rom");
    assert(ret === "Dear rom", { ret });
  });
}

async function basic_clientSideUse_requestObjectIsAvailbe({
  server,
  browserEval,
}) {
  server.hello = async function (name) {
    assert(this.headers.host.startsWith("localhost"));
    assert(this.headers["user-agent"].includes("HeadlessChrome"));
    return "Servus " + name;
  };

  await browserEval(async () => {
    const ret = await window.server.hello("Romuald");
    assert(ret === "Servus Romuald", { ret });
  });
}

async function basic_serverSideUse({ server, wildcardClient }) {
  const headers = [];
  server.hello = async function (name) {
    assert(this.headers === headers);
    return "heyy " + name;
  };

  const endpointResult = await wildcardClient.endpoints.hello.bind({ headers })(
    "Paul"
  );
  assert(endpointResult === "heyy Paul");
}

async function basic_serverSideUse_withoutRequestProps({
  server,
  wildcardClient,
}) {
  server.hello = async function (name) {
    return "yo " + name;
  };

  const endpointResult = await wildcardClient.endpoints.hello("Paul");
  assert(endpointResult === "yo Paul");
}
