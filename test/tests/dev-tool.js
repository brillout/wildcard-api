module.exports = [browseTelefunction, browseTelefunction__unescaped];

async function browseTelefunction({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_telefunc/hello/%5B"Johny"%5D', {
      method: "GET",
    });
    const text = await resp.text();
    assert(text.startsWith("<html>"), { text });
    assert(text.includes("Greetings Johny"), { text });
  });
}

async function browseTelefunction__unescaped({ server, browserEval }) {
  server.hello = async function (name) {
    return "Greetings " + name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/_telefunc/hello/["Liza"]', {
      method: "GET",
    });
    const text = await resp.text();
    assert(text.startsWith("<html>"), { text });
    assert(text.includes("Greetings Liza"), { text });
  });
}
