module.exports = [
  bigPayloads,
];

async function bigPayloads({wildcardApi, browserEval}) {
  const _bigArg = gen_big_string();
  const _bigResult = gen_big_string();

  wildcardApi.endpoints.bigEndpoint = async function({bigArg}) {
    assert(bigArg===_bigArg);
    return _bigResult;
  };

  await browserEval(async ({_bigArg, _bigResult}) => {
    const bigResult = await window.endpoints.bigEndpoint({bigArg: _bigArg});
    assert(bigResult===_bigResult);
  }, {args: {_bigResult, _bigArg}});
}

function gen_big_string() {
  let str = '';
  for(let i=0 ;i<100*10000; i++) {
    const char = Math.round(Math.random()*10).toString()[0];
    str += char;
  }
  return str;
}
