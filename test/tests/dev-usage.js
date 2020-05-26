module.exports = [listAllEndpoints, browseEndpoint, browseEndpoint__unescaped];

async function browseEndpoint({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/%5B"Johny"%5D');
    const text = await resp.text();
    assert(text.startsWith("<html>"), { text });
    assert(text.includes("Greetings Johny"), { text });
  });
}

async function browseEndpoint__unescaped({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/["Liza"]');
    const text = await resp.text();
    assert(text.startsWith("<html>"), { text });
    assert(text.includes("Greetings Liza"), { text });
  });
}

async function listAllEndpoints({ wildcardApi, browserEval }) {
  wildcardApi.endpoints.firstEndpoint = async function (name) {
    return "Greetings " + name;
  };
  wildcardApi.endpoints.secondEndpoint = async function () {};

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/");
    const text = await resp.text();
    assert(text.includes("firstEndpoint") && text.includes("secondEndpoint"), {
      text,
    });
  });
}
