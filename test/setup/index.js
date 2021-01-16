// TODO
// - Test the testing infra
//   - `grep 'browserEval\('` to ensure `await browserEval`

process.on("unhandledRejection", (err) => {
  throw err;
});

const assert = require("assert");
const util = require("util");
const stripAnsi = require("strip-ansi");
global.assert = assert;

const { resolve: pathResolve } = require("path");
const { TelefuncServer } = require("telefunc/server/TelefuncServer");
const { TelefuncClient } = require("telefunc/client/TelefuncClient");
const {
  noPendingHooks,
} = require("telefunc/server/context/async-hook-management");

const bundle = require("./browser/bundle");
//*/
const launchBrowser = require("./browser/launchBrowser__playwright");
/*/
const launchBrowser = require("./browser/launchBrowser__puppeteer");
//*/

const staticDir = pathResolve(__dirname + "/browser/dist/");

const {
  symbolSuccess,
  symbolError,
  colorError,
} = require("@brillout/cli-theme");
const chalk = require("chalk");

const httpPort = 3442;

(async () => {
  await bundle();

  const { browserEval: browserEval_org, closeBrowser } = await launchBrowser();
  let browserEval = browserEval_org.bind(null, httpPort);

  const { standardTests, integrationTests } = getTests();

  const debugMode =
    standardTests.length + integrationTests.length <= 1 ||
    process.argv.includes("--debug");

  await runStandardTests({
    standardTests,
    browserEval,
    serverFrameworks: ["getApiHttpResponse"],
    debugMode,
  });

  await runIntegrationTests({ integrationTests, browserEval, debugMode });

  if (!getSelectedTest()) {
    await runStandardTests({
      standardTests,
      browserEval,
      serverFrameworks: ["express", "koa", "hapi"],
      debugMode,
    });
  }

  await closeBrowser();

  assert(noPendingHooks());

  console.log(chalk.bold.green("All tests successfully passed."));
})();

async function runStandardTests({
  standardTests,
  browserEval,
  serverFrameworks,
  debugMode,
}) {
  const __INTERNAL_telefuncServer_middleware = {};

  for (let serverFramework of serverFrameworks) {
    let stop;
    const _startServer = require("./servers/" + serverFramework);
    const startServer = async (args) => {
      stop = await _startServer({
        __INTERNAL_telefuncServer_middleware,
        httpPort,
        staticDir,
        ...args,
      });
    };
    await startServer();

    for (let test of standardTests) {
      const telefuncServer = new TelefuncServer();
      const {
        telefunctions: server,
        config,
        setSecretKey,
        context,
      } = telefuncServer;
      __INTERNAL_telefuncServer_middleware.telefuncServer = telefuncServer;
      const telefuncClient = new TelefuncClient();
      telefuncClient.config.__INTERNAL_telefuncServer_test = telefuncServer;

      const testArgs = {
        server,
        context,
        config,
        browserEval,
        TelefuncServer,
        telefuncServer,
        setSecretKey,
        telefuncClient,
        TelefuncClient,
        httpPort,
        serverFramework,
      };

      await runTest({
        test,
        testArgs,
        serverFramework,
        debugMode,
      });
    }

    await stop();
  }
}

async function runTest({
  test: { testFn, testFile },
  serverFramework,
  testArgs,
  debugMode,
}) {
  const testName =
    "[" + serverFramework + "] " + testFn.name + " (" + testFile + ")";

  let expectedStderr = null;
  const assertStderr = (content, ...rest) => {
    assert(rest.length === 0);

    if (content === null) {
      assert(expectedStderr === null);
      assert(
        cleanStderr(stderrLogs).length === 0,
        util.inspect({ stderrLogs })
      );
      return;
    }

    assert(content.constructor === String);
    expectedStderr = expectedStderr || [];
    expectedStderr.push(content);
  };

  if (debugMode) {
    console.log(chalk.bold.blue("[DEBUG-MODE] Enabled."));
  }
  const log_collector = new LogCollector({ debugMode });
  log_collector.enable();
  const { stdoutLogs, stderrLogs } = log_collector;

  let testFailure;
  try {
    await testFn({ ...testArgs, assertStderr });
  } catch (err) {
    testFailure = err;
  } finally {
    log_collector.disable();
  }

  try {
    if (testFailure) throw testFailure;
    await checkStderr({ expectedStderr, stderrLogs });
    if (!debugMode) {
      await checkStdout(stdoutLogs);
    }
  } catch (err) {
    log_collector.flush();
    console.error(err);
    console.log(colorError(symbolError + "Failed test: " + testName));
    throw new Error("Tests failed.");
  }

  // Delete all cookies
  await testArgs.browserEval(() => {
    document.cookie.split(";").forEach(function (c) {
      document.cookie =
        c.trim().split("=")[0] +
        "=;" +
        "expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    });
    assert(document.cookie === "");
  });

  console.log(symbolSuccess + testName);

  return;
}

async function checkStderr({ expectedStderr, stderrLogs }) {
  // Express seems to rethrow errors asyncronously; we need to wait for express to rethrow errors.
  await new Promise((r) => setTimeout(r, 0));

  stderrLogs = cleanStderr(stderrLogs);
  const stderrLogsLength = stderrLogs.length;

  checkIfErrorIsExpected(stderrLogs);
  stderrLogs.forEach(checkErrorFormat);

  assert(expectedStderr === null || expectedStderr.length >= 1);

  if (expectedStderr === null) {
    assert(
      stderrLogsLength === 0,
      util.inspect({
        expectedLength: 0,
        stderrLogsLength,
        stderrLogs,
      })
    );
    return;
  }

  assert(stderrLogs.length === stderrLogsLength);
  assert(
    stderrLogs.length === expectedStderr.length,
    util.inspect({ stderrLogs, expectedStderr })
  );
  stderrLogs.forEach((stderrLog, i) => {
    const stderrContent = expectedStderr[i];
    assert(
      stderrLog.includes(stderrContent),
      util.inspect({
        expectedStderr: stderrContent,
        actualStderr: stderrLog,
      })
    );
  });

  return;

  function checkErrorFormat(stderrLog) {
    assert(stderrLog.constructor === String);
    const [firstLine, ...errorStackLines] = stderrLog.split("\n");

    // Always start with a single-line error message
    if (
      !firstLine.includes("[Telefunc][Wrong Usage] ") &&
      !firstLine.includes("[EXPECTED_ERROR]")
    ) {
      console.log(stderrLog);
      assert(false);
    }

    // Always show a stack trace
    if (errorStackLines.length <= 5) {
      console.log(stderrLog);
      assert(false);
    }

    // Rest is stack trace
    errorStackLines.forEach((errStackLine) => {
      if (errStackLine === "") {
        return;
      }
      if (stripAnsi(errStackLine).startsWith("    at")) {
        return;
      }
      console.log("==Error:");
      console.log(stderrLog);
      console.log("==Line:");
      console.log(errStackLine);
      assert(false);
    });

    // Stack trace should never show @brillout/assert code
    assert(!stripAnsi(stderrLog).includes("@brillout/assert"));
  }
  function checkIfErrorIsExpected(stderrLogs) {
    stderrLogs.forEach((stderrLog) => {
      // No test should throw an internal errors
      // => re-throw, interupt the test run, and show the error
      if (stderrLog.includes("[Internal Error]")) {
        throw stderrLog;
      }

      // It is expected that test can throw a [Wrong Usage] or
      // an error constructed by the test itself ([EXPECTED_ERROR])
      if (
        stderrLog.includes("[Telefunc][Wrong Usage]") ||
        stderrLog.includes("[EXPECTED_ERROR]")
      ) {
        return;
      }

      // It seems like these pesting `JSHandle@error` can be circumvented
      // by logging `err.stack` instead of `err`.
      if (stderrLog.includes("JSHandle@error")) {
        console.log(stderrLog);
        assert(
          false,
          "Make sure to `console.error(err.stack)` instead of `console.error(err)` in `browserEval`"
        );
      }

      // Any other error are unexpected
      console.log("Unexpected error type:");
      console.log(stderrLog);
      assert(false, "Unexpected kind of error.");
    });
  }
}

async function checkStdout(stdoutLogs) {
  stdoutLogs = cleanStdout(stdoutLogs);
  assert(stdoutLogs.length === 0);
}

function cleanStdout(stdoutLogs) {
  return removeHiddenLog(stdoutLogs);
}
function cleanStderr(stderrLogs) {
  return removeHiddenLog(removeNetworkErrorLogs(stderrLogs));
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
function removeNetworkErrorLogs(stdLogs) {
  return stdLogs.filter(
    (log) =>
      // Browser-side puppeteer logs when telefunction failed
      ![
        "Failed to load resource: net::ERR_INTERNET_DISCONNECTED\n",
        "Failed to load resource: net::ERR_CONNECTION_REFUSED\n",
        "Failed to load resource: the server responded with a status of 500 (Internal Server Error)\n",
        "Failed to load resource: the server responded with a status of 400 (Bad Request)\n",
        "Failed to load resource: the server responded with a status of 404 (Not Found)\n",
      ].includes(log)
  );
}

async function runIntegrationTests({
  integrationTests,
  browserEval,
  debugMode,
}) {
  for (test of integrationTests) {
    const testArgs = {
      browserEval,
      staticDir,
      TelefuncClient,
      TelefuncServer,
      httpPort,
    };
    await runTest({
      test,
      testArgs,
      serverFramework: "custom-server",
      debugMode,
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

  assert(!noTest(), `No test \`${selectedTest}\` found.`);

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
  let cliArgs = process.argv.slice(2);
  cliArgs = cliArgs.filter((arg) => arg !== "--debug");
  assert(cliArgs.length <= 1);
  return cliArgs[0];
}

function LogCollector({ debugMode }) {
  assert([true, false].includes(debugMode));

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
      if (debugMode) {
        stdout_write.apply(process.stdout, args);
      }
      stdout_write_calls.push(args);
      stdoutLogs.push(...args.map((o) => o.toString()));
    };
    process.stderr.write = (...args) => {
      if (debugMode) {
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
    if (debugMode) {
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
