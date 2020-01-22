module.exports = [
  validUsage1,
  validUsage2,
  wrongUrl1,
  wrongUrl2,
  wrongUrl3,
  noEndpoints,
  noEndpoints2,
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
    assert(text.includes('Malformatted API request `/wildcard/hello/wrongArgSyntax`'), {text});
    assert(text.includes('The URL arguments should be a JSON array.'), {text});
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
    assert(text.includes('Malformatted API request `/wildcard/hello/{}`'), {text});
    assert(text.includes('The URL arguments should be a JSON array.'), {text});
  });
}

async function noEndpoints({wildcardApi, browserEval}) {
  await browserEval(async () => {
    const resp = await window.fetch('/wildcard/hello');
    const text = await resp.text();
    console.log(text);
    assert(resp.status===404, resp.status);
    assert(text.includes("Endpoint `hello` doesn't exist."), {text});
    assert(text.includes("You didn't define any endpoints."), {text});
    assert(text.includes("Make sure that the file that defines `hello` is named"), {text});
  });
}

async function noEndpoints2({wildcardApi, wildcardClient}) {
  let errorThrown = false;
  try {
    await wildcardClient.endpoints.helloSsr();
  } catch(err) {
    errorThrown = true;
    assert(err.stack.includes("Endpoint `helloSsr` doesn't exist."), err.stack);
    assert(err.stack.includes("You didn't define any endpoints."), err.stack);
    assert(err.stack.includes("Make sure that the file that defines `helloSsr` is named"), err.stack);
  }
  assert(errorThrown===true);
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
    assert(!text.includes("You didn't define any endpoints."), {text});
  });
}

async function ssrMissingRequestProps({wildcardApi, wildcardClient}) {
  let endpointFunctionCalled = false;
  wildcardApi.endpoints.ssrTest = async function() {
    let errorThrown = false;
    try {
      this.headers;
    } catch(err) {
      errorThrown = true;
      assert(err);
      assert(err.stack.includes('Make sure to provide `headers` by using `bind({headers})` when calling your `ssrTest` endpoint in Node.js'), err.stack);
    }
    assert(errorThrown===true);
    endpointFunctionCalled = true;
  };

  await wildcardClient.endpoints.ssrTest();
  assert(endpointFunctionCalled===true);
}
