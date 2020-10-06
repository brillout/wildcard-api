// TODO
// - Test the testing infra
//   - `grep 'browserEval\('` to ensure `await browserEval`

process.on("unhandledRejection", (err) => {
  throw err;
});

const { assertUsage } = require("@brillout/assert");
const assert = require("assert");
const util = require("util");
global.assert = assert;

const { resolve: pathResolve } = require("path");
const { WildcardServer } = require("@wildcard-api/server");
const { WildcardClient } = require("@wildcard-api/client");

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

  const { browserEval: browserEval_org, browser } = await launchBrowser();
  let browserEval = browserEval_org.bind(null, httpPort);

  const { standardTests, integrationTests } = getTests();

  const silentMode = standardTests.length + integrationTests.length > 1;

  await runStandardTests({
    standardTests,
    browserEval,
    serverFrameworks: ["getApiHttpResponse"],
    silentMode,
  });

  await runIntegrationTests({ integrationTests, browserEval, silentMode });

  if (!getSelectedTest()) {
    await runStandardTests({
      standardTests,
      browserEval,
      serverFrameworks: ["express", "koa", "hapi"],
      silentMode,
    });
  }

  await browser.close();

  console.log(chalk.bold.green("All tests successfully passed."));
})();

async function runStandardTests({
  standardTests,
  browserEval,
  serverFrameworks,
  silentMode,
}) {
  const __INTERNAL_wildcardServer_middleware = {};

  for (let serverFramework of serverFrameworks) {
    let stop;
    const _startServer = require("./servers/" + serverFramework);
    const startServer = async (args) => {
      stop = await _startServer({
        __INTERNAL_wildcardServer_middleware,
        httpPort,
        staticDir,
        ...args,
      });
    };
    await startServer();

    for (let test of standardTests) {
      const wildcardServer = new WildcardServer();
      const { endpoints: server, config } = wildcardServer;
      __INTERNAL_wildcardServer_middleware.wildcardServer = wildcardServer;
      const wildcardClient = new WildcardClient();
      wildcardClient.config.__INTERNAL_wildcardServer_test = wildcardServer;

      const testArgs = {
        server,
        config,
        wildcardClient,
        WildcardClient,
        browserEval,
        httpPort,
      };

      await runTest({
        test,
        testArgs,
        serverFramework,
        silentMode,
      });
    }

    await stop();
  }
}

async function runTest({
  test: { testFn, testFile },
  serverFramework,
  testArgs,
  silentMode,
}) {
  const testName =
    "[" + serverFramework + "] " + testFn.name + " (" + testFile + ")";

  let stderrContents = null;
  const assertStderr = (content, ...rest) => {
    assert(rest.length === 0);

    if (content === null) {
      assert(stderrContents === null);
      stderrContents = null;
      return;
    }

    assert(content.constructor === String);
    stderrContents = stderrContents || [];
    stderrContents.push(content);
  };

  const log_collector = new LogCollector({ silenceLogs: silentMode && !DEBUG });
  log_collector.enable();
  const { stdoutLogs, stderrLogs } = log_collector;

  let testFailure;
  try {
    await testFn({ ...testArgs, assertStderr });
  } catch (err) {
    log_collector.flush();
    testFailure = err;
  } finally {
    log_collector.disable();
  }

  try {
    if (testFailure) throw testFailure;
    await checkStderr({ stderrContents, stderrLogs });
    await checkStdout(stdoutLogs);
  } catch (err) {
    console.error(err);
    console.log(colorError(symbolError + "Failed test: " + testName));
    process.exit();
  }

  console.log(symbolSuccess + testName);

  return;
}

async function checkStderr({ stderrContents, stderrLogs }) {
  // Express seems to rethrow errors asyncronously; we need to wait for express to rethrow errors.
  await new Promise((r) => setTimeout(r, 0));

  stderrLogs = removeHiddenLog(stderrLogs);
  const stderrLogsLength = stderrLogs.length;

  checkStderrFormat(stderrLogs);

  assert(stderrContents === null || stderrContents.length >= 1);

  if (stderrContents === null) {
    assert(
      stderrLogsLength === 0,
      util.inspect({ stderrLogsLength, stderrLogs })
    );
    return;
  }

  assert(
    stderrLogsLength === 1,
    util.inspect({ stderrLogsLength, stderrLogs })
  );
  const stderrLog = stderrLogs[0];
  stderrContents.forEach((stderrContent) => {
    assert(
      stderrLog.includes(stderrContent),
      util.inspect({ stderrContent, stderrLog })
    );
  });

  return;

  function checkStderrFormat(stderrLogs) {
    stderrLogs.forEach((stderrLog) => {
      const debug = util.inspect(stderrLog);

      const [firstLine, ...errorStackLines] = stderrLog;

      // Always start with a single-line error message
      assert(!firstLine.startsWith(" "), debug);

      // Always show a stack trace
      assert(errorStackLines.length >= 1, debug);

      // Rest is stack trace
      errorStackLines.forEach((errStackLine) => {
        assert(!errStackLine.startsWith("    at"), debug);
      });
    });
  }
}

async function checkStdout(stdoutLogs) {
  stdoutLogs = removeHiddenLog(stdoutLogs);
  stdoutLogs = removePuppeteerLogs(stdoutLogs);

  assert(stdoutLogs.length === 0);

  return;

  function removePuppeteerLogs(stdoutLogs) {
    return stdoutLogs.filter(
      (log) =>
        // Browser-side puppeteer logs when endpoint failed
        ![
          "Failed to load resource: net::ERR_INTERNET_DISCONNECTED\n",
          "Failed to load resource: net::ERR_CONNECTION_REFUSED\n",
          "Failed to load resource: the server responded with a status of 500 (Internal Server Error)\n",
          "Failed to load resource: the server responded with a status of 400 (Bad Request)\n",
          "Failed to load resource: the server responded with a status of 404 (Not Found)\n",
        ].includes(log)
    );
  }
}

function removeHiddenLog(stdLogs) {
  return stdLogs.filter(
    (log) =>
      !log ||
      !log.includes(
        // Puppeteer "hidden" log (never saw such hidden log before; I don't know how and why this exists)
        "This conditional evaluates to true if and only if there was an error"
      )
  );
}

async function runIntegrationTests({
  integrationTests,
  browserEval,
  silentMode,
}) {
  for (test of integrationTests) {
    const testArgs = { browserEval, staticDir, httpPort };
    await runTest({
      test,
      testArgs,
      serverFramework: "custom-server",
      silentMode,
    });
  }
}

function getTests() {
  const glob = require("glob");
  const path = require("path");

  const projectRoot = __dirname + "/..";

  const selectedTest = getSelectedTest();

  const testsAll = getTestsAll();

  const standardTests = [];
  const integrationTests = [];
  testsAll.forEach(({ testFile, testFn }) => {
    if (!selectedTest) {
      addTest({ testFile, testFn });
      return;
    }

    if (selectedTest === testFn.name) {
      addTest({ testFile, testFn });
      return;
    }
  });

  if (selectedTest) {
    if (noTest()) {
      testsAll.forEach((testInfo) => {
        const { testFile } = testInfo;
        if (testFile.includes(selectedTest)) {
          addTest(testInfo);
          return;
        }
      });
    }
    if (noTest()) {
      testsAll.forEach((testInfo) => {
        const functionName = testInfo.testFn.name;
        if (functionName.includes(selectedTest)) {
          addTest(testInfo);
          return;
        }
      });
    }
  }

  assertUsage(!noTest(), `No test \`${selectedTest}\` found.`);

  return { standardTests, integrationTests };

  function noTest() {
    return standardTests.length === 0 && integrationTests.length === 0;
  }
  function addTest(testInfo) {
    if (testInfo.testFn.isIntegrationTest) {
      integrationTests.push(testInfo);
    } else {
      standardTests.push(testInfo);
    }
  }
  function getTestsAll() {
    const testsAll = [];
    const testFiles = glob.sync(projectRoot + "/tests/*.js");
    testFiles.forEach((filePath) => {
      require(filePath).forEach((testFn) => {
        assertTest(testFn);
        const testFile = path.relative(projectRoot, filePath);
        testsAll.push({ testFile, testFn });
      });
    });
    return testsAll;
    function assertTest(testFn) {
      assert(testFn.name);
      assert(testFn.constructor.name === "AsyncFunction");
    }
  }
}
function getSelectedTest() {
  return getCLIArgument();
}
function getCLIArgument() {
  assert([2, 3].includes(process.argv.length));
  return process.argv[2];
}

function LogCollector({ silenceLogs }) {
  assert([true, false].includes(silenceLogs));

  let stdout_write;
  let stderr_write;
  const stdout_write_calls = [];
  const stderr_write_calls = [];

  const stdoutLogs = [];
  const stderrLogs = [];

  return { enable, disable, flush, stdoutLogs, stderrLogs };

  function enable() {
    stdout_write = process.stdout.write;
    stderr_write = process.stderr.write;
    process.stdout.write = (...args) => {
      if (!silenceLogs) {
        stdout_write.apply(process.stdout, args);
      }
      stdout_write_calls.push(args);
      stdoutLogs.push(...args.map((o) => o.toString()));
    };
    process.stderr.write = (...args) => {
      if (!silenceLogs) {
        stderr_write.apply(process.stderr, args);
      }
      stderr_write_calls.push(args);
      stderrLogs.push(...args.map((o) => o.toString()));
    };
  }
  function disable() {
    process.stdout.write = stdout_write;
    process.stderr.write = stderr_write;
  }
  function flush() {
    if (!silenceLogs) {
      return;
    }
    stdout_write_calls.forEach((args) =>
      stdout_write.apply(process.stdout, args)
    );
    stderr_write_calls.forEach((args) =>
      stderr_write.apply(process.stderr, args)
    );
  }
}
