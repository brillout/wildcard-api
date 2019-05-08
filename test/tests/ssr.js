module.exports = [
  ssr,
  ssrWithRequestObject,
];

async function ssr({wildcardApi, wildcardClient}) {
  const headers = [];
  wildcardApi.endpoints.hello = async function(name) {
    assert(this.headers===headers);
    return 'heyy '+name;
  };

  const endpointResult = await wildcardClient.endpoints.hello.bind({headers})('Paul');
  assert(endpointResult==='heyy Paul');
};

async function ssrWithRequestObject({wildcardApi, wildcardClient}) {
  wildcardApi.endpoints.hello = async function(name) {
    return 'yo '+name;
  };

  const endpointResult = await wildcardClient.endpoints.hello('Paul');
  assert(endpointResult==='yo Paul');
};
