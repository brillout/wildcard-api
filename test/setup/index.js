process.on('unhandledRejection', err => {throw err});

const assert = require('@brillout/reassert');
global.assert = assert;

const WildcardApi = require('../../server/WildcardApi');
const WildcardClient = require('../../client/WildcardClient');
const {parse, stringify} = require('../../client/serializer');
const makeHttpRequest = require('../../client/makeHttpRequest');

const bundle = require('./browser/bundle');
const launchBrowser = require('./browser/launchBrowser');

const startServer = require('./startServer');

const {symbolSuccess, symbolError, colorError} = require('@brillout/cli-theme');

/*
const DEBUG = true;
/*/
const DEBUG = false;
//*/

(async () => {
  await bundle();

  const log_suppressor = new LogSupressor();

  const wildcardApiHolder = {};
  const server = await startServer(wildcardApiHolder);

  const {browserEval, browser} = await launchBrowser();
  for(let {test, file} of getTests()) {
    const wildcardApi = WildcardApi();

    Object.assign(wildcardApiHolder, {wildcardApi});

    const wildcardClient = new WildcardClient({wildcardApi, makeHttpRequest, stringify, parse});

    const testName = test.name+' ('+file+')';

    !DEBUG && log_suppressor.enable();
    try {
      await test({wildcardApi, wildcardClient, browserEval});
    } catch(err) {
      !DEBUG && log_suppressor.flush();
      !DEBUG && log_suppressor.disable();
      console.log(colorError(symbolError+'Failed test: '+testName));
      throw err;
    }
    !DEBUG && log_suppressor.disable();

    console.log(symbolSuccess+testName);
  }

  await browser.close();

  await server.stop();
})();

function getTests() {
  const glob = require('glob');
  const path = require('path');

  const projectRoot = __dirname+'/..';

  const testFiles = glob.sync(projectRoot+'/tests/*.js');
  const tests = [];
  testFiles.forEach(filePath => {
    require(filePath).forEach(test => {
      const file = path.relative(projectRoot, filePath);
      tests.push({test, file})
    });
  });

  return tests;
}

function LogSupressor() {
  let stdout__calls;
  let stderr__calls;

  let stdout__original;
  let stderr__original;

  return {enable, disable, flush};

  function enable() {
    stdout__original = process.stdout.write;
    stderr__original = process.stderr.write;
    stdout__calls = [];
    stderr__calls = [];
    process.stdout.write = (...args) => {stdout__calls.push(args)};
    process.stderr.write = (...args) => {stderr__calls.push(args)};
  }
  function disable() {
    process.stdout.write = stdout__original;
    process.stderr.write = stderr__original;
  }
  function flush() {
    stdout__calls.forEach(args => stdout__original.apply(process.stdout, args));
    stderr__calls.forEach(args => stderr__original.apply(process.stderr, args));
  }
}
