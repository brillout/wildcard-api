module.exports = [
  // `getApiHttpResponse` returns null for non-wildcard HTTP requests
  doesntIntefere1,
  // Wildcard server middlewares don't intefere with non-wildcard HTTP requests
  doesntIntefere2,
];

async function doesntIntefere1({ server, wildcardServer }) {
  server.getme = function () {
    return "you got me";
  };
  {
    const responseProps = await wildcardServer.getApiHttpResponse({
      method: "POST",
      url: "/_wildcard-apii",
    });
    assert(responseProps === null);
  }
  {
    const responseProps = await wildcardServer.getApiHttpResponse({
      method: "POST",
      url: "/_wildcard_api/getme",
    });
    assert(responseProps.body === `"you got me"`);
  }
}

async function doesntIntefere2({ server, browserEval }) {
  server.myEndpoint = async function () {
    return "Grüß di";
  };

  await browserEval(async () => {
    const resp1 = await window.fetch("/hey-before", {
      method: "GET",
    });
    assert(resp1.status === 200);
    const text1 = await resp1.text();
    assert(text1 === "Hello darling");

    const endpointRet = await window.server.myEndpoint();
    assert(endpointRet === "Grüß di");

    const resp2 = await window.fetch("/hey/after", {
      method: "POST",
    });
    assert(resp2.status === 200);
    const text2 = await resp2.text();
    assert(text2 === "Hello again");
  });
}
