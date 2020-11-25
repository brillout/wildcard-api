const { chromium } = require("playwright");

module.exports = launchBrowser;

async function launchBrowser() {
  const browser = await chromium.launch();

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (consoleObj) => console.log(consoleObj.text()));

  let _onHttpRequest;
  page.route("**", async (route) => {
    if (_onHttpRequest) {
      const request = route.request();
      const _postData = request.postData() || undefined;
      const _url = request.url();
      await _onHttpRequest({ _postData, _url });
    }
    route.continue();
  });

  return {
    closeBrowser: async () => {
      await browser.close();
    },
    browserEval,
  };

  var httpPort__current;
  async function browserEval(
    httpPort,
    fn,
    { offlineMode = false, browserArgs, onHttpRequest } = {}
  ) {
    if (httpPort !== httpPort__current) {
      await page.goto("http://localhost:" + httpPort);
      httpPort__current = httpPort;
    }

    _onHttpRequest = onHttpRequest;

    await context.setOffline(offlineMode);

    let ret;
    try {
      ret = await page.evaluate(fn, browserArgs);
    } catch (err) {
      console.error(err);
    } finally {
      _onHttpRequest = null;
    }
    return ret;
  }
}

