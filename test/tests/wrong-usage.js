module.exports = [
  validUsage1,
  validUsage2,
  wrongUrl1,
  wrongUrl2,
  wrongUrl3,
  noEndpoints,
  endpointDoesNotExist,
  ssrMissingRequestProps,
];

async function validUsage1({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Yo '+name+'!';
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/hello/["Mom"]');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===200, resp.status);
    assert(text.includes('Yo Mom!'), {text});
  });
}

async function validUsage2({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Yo '+name+'!';
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/hello/%5B%22Mom%22%5D');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===200, resp.status);
    assert(text.includes('Yo Mom!'), {text});
  });
}

async function wrongUrl1({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function() {
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard//hello');
    const text = await resp.text();
    assert(resp.status===400, resp.status);
    assert(text.includes('Malformatted API URL `/wildcard//hello`'), {text});
    assert(text.includes('API URL should have following format:'), {text});
  });
}

async function wrongUrl2({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Greetings '+name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/hello/wrongArgSyntax');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===400, resp.status);
    assert(text.includes('Malformatted API URL `/wildcard/hello/wrongArgSyntax`'), {text});
    assert(text.includes("Couldn't JSON parse the argument string."), {text});
    assert(text.includes('Is the argument string a valid JSON?'), {text});
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
    assert(resp.status===400, resp.status);
    assert(text.includes('Malformatted API URL `/wildcard/hello/{}`'), {text});
    assert(text.includes('URL arguments') && text.includes('should be an array'), {text});
  });
}

async function noEndpoints({wildcardApi, browserEval}) {
  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/hello');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===404, resp.status);
    assert(text.includes("Endpoint `hello` doesn't exist."), {text});
    assert(text.includes("You didn't define any endpoint function."), {text});
    assert(text.includes("Did you load your endpoint definitions?"), {text});
  });
}

async function endpointDoesNotExist({wildcardApi, browserEval}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'Greetings '+name;
  };

  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/blub');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===404, resp.status);
    assert(text.includes("Endpoint `blub` doesn't exist."), {text});
  });
}

async function ssrMissingRequestProps({wildcardApi, wildcardClient}) {
  let endpointFunctionCalled = false;
  wildcardApi.endpoints.ssrTest = async function() {
    let exceptionThrown;
    try {
      this.headers;
      exceptionThrown = false;
    } catch(err) {
      exceptionThrown = true;
      assert(err);
      assert(err.stack.includes('Make sure to provide `headers` by using `bind({headers})` when calling your `ssrTest` endpoint in Node.js'), err.stack);
    }
    assert(exceptionThrown===true);
    endpointFunctionCalled = true;
  };

  await wildcardClient.endpoints.ssrTest();
  assert(endpointFunctionCalled===true);
}
