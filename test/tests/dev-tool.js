module.exports = [browseEndpoint, browseEndpoint__unescaped];

async function browseEndpoint({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_telefunc/hello/%5B"Johny"%5D');
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
    const resp = await window.fetch('/_telefunc/hello/["Liza"]');
    const text = await resp.text();
    assert(text.startsWith("<html>"), { text });
    assert(text.includes("Greetings Liza"), { text });
  });
}
