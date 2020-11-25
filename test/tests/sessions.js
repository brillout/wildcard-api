module.exports = [contextChange_getApiHttpResponse, contextChange];

async function contextChange_getApiHttpResponse({
  telefuncServer,
  server,
  setSecretKey,
}) {
  setSecretKey("uihewqiehqiuehuaheliuhawiulehqchbas");

  server.withContextChange = function () {
    this.userName = "brillout";
  };

  const url = "https://example.org/_telefunc/withContextChange";
  const method = "POST";

  const responseProps = await telefuncServer.getApiHttpResponse({
    url,
    method,
  });
  assert(responseProps.statusCode === 200);
  assert(responseProps.body === `"json-s:tYpE|undefined"`);
  assert(responseProps.headers[1].name === "Set-Cookie");
  assert(
    responseProps.headers[1].value ===
      "telefunc-context_userName=%22brillout%22; Max-Age=315360000"
  );
  assert(responseProps.headers[2].name === "Set-Cookie");
  assert(
    responseProps.headers[2].value.startsWith(
      "telefunc-context-signaure_userName=805a7267a154c24ef1833704ca4f04aba13f8a6bd96c61e6b7419cf8ee72f316; Max-Age=315360000; HttpOnly; Secure"
    )
  );
}

async function contextChange({ server, browserEval, setSecretKey }) {
  setSecretKey("quieahbcqbohiawlubcsbi*&@381y87wqiwdhawbl");

  server.login = async function (name) {
    this.user = name;
  };
  server.whoAmI = async function () {
    return "You are: " + this.user;
  };
  await browserEval(async () => {
    const ret1 = await window.server.whoAmI();
    assert(ret1 === "You are: undefined");
    await window.server.login("rom");
    const ret2 = await window.server.whoAmI();
    assert(ret2 === "You are: rom");
  });
}
