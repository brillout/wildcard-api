module.exports = [
  wrongUrl1,
  wrongUrl2,
  wrongUrl3,
];

async function wrongUrl1({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Greetings '+name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/hello/wrongArgSyntax');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===404, resp.status);
    assert(text.includes('Is the argument string a valid JSON?'), {text});
  });
}

async function wrongUrl2({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Greetings '+name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard//hello/[]');
    const text = await resp.text();
    assert(resp.status===404, resp.status);
    assert(text.includes('Malformatted API URL'), {text});
  });
}

async function wrongUrl3({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Greetings '+name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/hello/{}');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===404, resp.status);
    assert(text.includes('URL arguments') && text.includes('should be an array'), {text});
  });
}
