module.exports = [listAllEndpoints, browseEndpoint, browseEndpoint__unescaped];

async function browseEndpoint({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/%5B"Johny"%5D');
    const text = await resp.text();
    assert(text.startsWith("<html>"), { text });
    assert(text.includes("Greetings Johny"), { text });
  });
}

async function browseEndpoint__unescaped({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_wildcard_api/hello/["Liza"]');
    const text = await resp.text();
    assert(text.startsWith("<html>"), { text });
    assert(text.includes("Greetings Liza"), { text });
  });
}

async function listAllEndpoints({ server, browserEval }) {
  server.firstEndpoint = async function (name) {
    return "Greetings " + name;
  };
  server.secondEndpoint = async function () {};

  await browserEval(async () => {
    const resp = await window.fetch("/_wildcard_api/");
    const text = await resp.text();
    assert(text.includes("firstEndpoint") && text.includes("secondEndpoint"), {
      text,
    });
  });
}
