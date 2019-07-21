module.exports = [
  bigPayloads,
];

async function bigPayloads({wildcardApi, browserEval}) {
  const _bigArg = gen_big_string();
  const _bigResult = gen_big_string();

  wildcardApi.endpoints.hello = async function({bigArg}) {
    assert(bigArg===_bigArg);
    return _bigResult;
  };

  await browserEval(async ({_bigArg, _bigResult}) => {
    const bigResult = await window.endpoints.hello({bigArg: _bigArg});
    assert(bigResult===_bigResult);
  }, {args: {_bigResult, _bigArg}});
}

function gen_big_string() {
  let str = '';
  for(let i=0 ;i<100*1000; i++) {
    const char = Math.round(Math.random()*10).toString()[0];
    str += char;
  }
  return str;
}
