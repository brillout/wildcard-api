module.exports = [
  ssrWithContext,
  ssrWithoutContext,
];

async function ssrWithContext({wildcardApi, wildcardClient}) {
  const headers = [];
  wildcardApi.endpoints.hello = async function(name) {
    assert(this.headers===headers);
    return 'hi '+name;
  };

  const endpointResult = await wildcardClient.endpoints.hello.bind({headers})('Paul');
  assert(endpointResult==='hi Paul');
};

async function ssrWithoutContext({wildcardApi, wildcardClient}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'hi '+name;
  };

  const endpointResult = await wildcardClient.endpoints.hello('Paul');
  assert(endpointResult==='hi Paul');
};
