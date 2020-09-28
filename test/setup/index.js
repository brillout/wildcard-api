process.on("unhandledRejection", (err) => {
  throw err;
});

const assert = require("@brillout/assert");
global.assert = assert;

const {resolve: pathResolve} = require('path');
const WildcardApi = require("@wildcard-api/server/WildcardApi");
const WildcardClient = require("@wildcard-api/client/WildcardClient");

const bundle = require("./browser/bundle");
const launchBrowser = require("./browser/launchBrowser");

const staticDir = pathResolve(__dirname + "/browser/dist/");

const {
  symbolSuccess,
  symbolError,
  colorError,
} = require("@brillout/cli-theme");
const chalk = require("chalk");

/*
const DEBUG = true;
/*/
const DEBUG = false;
//*/

const httpPort = 3442;

(async () => {
  await bundle();

  const log_suppressor = new LogSupressor();

  const { browserEval: browserEval_org, browser } = await launchBrowser();
  let browserEval = browserEval_org.bind(null, httpPort);

  const {standardTests, integrationTests} = getTests();

  await runStandardTests({standardTests, browserEval, log_suppressor});

  await runIntegrationTests({integrationTests, browserEval, log_suppressor});

  await browser.close();

  console.log(chalk.bold.green("All tests successfully passed."));
})();

async function runStandardTests({standardTests, browserEval, log_suppressor}) {
  const wildcardApiHolder = {};

  for (let serverFramework of ['getApiHttpResponse', 'express', 'koa', 'hapi']) {
    let stop;
    const _startServer = require("./servers/" + serverFramework);
    const startServer = async (args) => {
      stop = await _startServer({
        wildcardApiHolder,
        httpPort,
        staticDir,
        ...args
      });
    };
    await startServer();

    for (let test of standardTests) {
      const wildcardApi = new WildcardApi();
      wildcardApiHolder.wildcardApi = wildcardApi;
      const wildcardClient = new WildcardClient();
      wildcardClient.__INTERNAL__wildcardApi = wildcardApi;

      const testArgs = {
        wildcardApi,
        wildcardClient,
        WildcardClient,
        browserEval,
        httpPort,
      };

      await runTest({test, testArgs, serverFramework, log_suppressor});
    }

    await stop();
  }
}

async function runTest({test: {testFn, testFile}, serverFramework, testArgs, log_suppressor}) {
  const testName = "[" + serverFramework + "] " + testFn.name + " (" + testFile + ")";

  !DEBUG && log_suppressor.enable();

  try {
    await testFn(testArgs);
  } catch (err) {
    !DEBUG && log_suppressor.flush();
    !DEBUG && log_suppressor.disable();
    console.log(colorError(symbolError + "Failed test: " + testName));
    throw err;
  }
  !DEBUG && log_suppressor.disable();

  console.log(symbolSuccess + testName);
}

async function runIntegrationTests({integrationTests, browserEval, log_suppressor}) {
  for(test of integrationTests) {
    const testArgs = {browserEval, staticDir, httpPort};
    await runTest({test, testArgs, log_suppressor, serverFramework: 'custom-server'});
  }
}

function getTests() {
  const glob = require("glob");
  const path = require("path");

  const projectRoot = __dirname + "/..";

  const testFiles = glob.sync(projectRoot + "/tests/*.js");
  const standardTests = [];
  const integrationTests = [];
  testFiles.forEach((filePath) => {
    require(filePath).forEach((testFn) => {
      const testFile = path.relative(projectRoot, filePath);
      const args = {testFile, testFn};
      if( testFn.isIntegrationTest ){
        integrationTests.push(args);
      } else {
        standardTests.push(args);
      }
    });
  });

  return {standardTests, integrationTests};
}

function LogSupressor() {
  let stdout__calls;
  let stderr__calls;

  let stdout__original;
  let stderr__original;

  return { enable, disable, flush };

  function enable() {
    stdout__original = process.stdout.write;
    stderr__original = process.stderr.write;
    stdout__calls = [];
    stderr__calls = [];
    process.stdout.write = (...args) => {
      stdout__calls.push(args);
    };
    process.stderr.write = (...args) => {
      stderr__calls.push(args);
    };
  }
  function disable() {
    process.stdout.write = stdout__original;
    process.stderr.write = stderr__original;
  }
  function flush() {
    stdout__calls.forEach((args) =>
      stdout__original.apply(process.stdout, args)
    );
    stderr__calls.forEach((args) =>
      stderr__original.apply(process.stderr, args)
    );
  }
}
