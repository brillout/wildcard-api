process.on('unhandledRejection', err => {throw err});

const assert = require('reassert');
global.assert = assert;

const {WildcardApi} = require('../../');

const bundle = require('./browser/bundle');
const launchBrowser = require('./browser/launchBrowser');

const startServer = require('./startServer');

(async () => {
  await bundle();

  const wildcardApiHolder = {};
  const server = await startServer(wildcardApiHolder);

  const {browserEval, browser} = await launchBrowser();

  for(let test of getTests()) {
    const wildcardApi = WildcardApi();
    Object.assign(wildcardApiHolder, {wildcardApi});
    await test(wildcardApi, {browserEval});
    console.log('Success '+test.name);
  }

  await browser.close();

  await server.stop();
})();

function getTests() {
  const glob = require('glob');

  const testFiles = glob.sync(__dirname+'/../tests/*.js');
  const tests = [];
  testFiles.forEach(file => {
    require(file).forEach(test => {
      tests.push(test)
    });
  });

  return tests;
}
