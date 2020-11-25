module.exports = [
  contextChange_getApiHttpResponse,
  // contextChange,
  // Avoid prettier wrap
];

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
  assert(responseProps.headers["Set-Cookie"]);
  assert(
    responseProps.headers["Set-Cookie"][0] ===
      "telefunc-context_userName=%22brillout%22; Max-Age=315360000; Path=/"
  );
  assert(
    responseProps.headers["Set-Cookie"][1] ===
      "telefunc-context-signaure_userName=805a7267a154c24ef1833704ca4f04aba13f8a6bd96c61e6b7419cf8ee72f316; Max-Age=315360000; Path=/; HttpOnly"
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
