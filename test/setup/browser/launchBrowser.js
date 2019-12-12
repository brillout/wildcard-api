const puppeteer = require('puppeteer');
const assert = require('@brillout/assert');

module.exports = launchBrowser;

async function launchBrowser() {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  page.on('console', consoleObj => console.log(consoleObj.text()));

	/*
	page.on("pageerror", function(err) {
			const theTempValue = err.toString();
			console.log("Page error: " + theTempValue);
	});
	page.on("error", function (err) {
			const theTempValue = err.toString();
			console.log("Error: " + theTempValue);
	});
	*/

  let _onHttpRequest;
  page.on('request', async request => {
    if( _onHttpRequest ){
      await _onHttpRequest(request);
      request.continue();
    }
  });

  return {
    browser,
    browserEval,
  };

  var httpPort__current;
  async function browserEval(httpPort, fn, {offlineMode=false, browserArgs, onHttpRequest}={}) {
    if( httpPort!==httpPort__current ){
      await page.goto('http://localhost:'+httpPort);
      httpPort__current = httpPort;
    }

    // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#requestcontinueoverrides
    _onHttpRequest = onHttpRequest;
    await page.setRequestInterception(!!onHttpRequest);

    await page.setOfflineMode(offlineMode);

    let ret;
    try {
      ret = await page.evaluate(fn, browserArgs);
    } catch(err) {
      /*
      // Non-helpful error "Evaluation failed: [object Object]" is a bug:
      // - https://github.com/GoogleChrome/puppeteer/issues/4651
      console.log('bef');
      console.log(Object.getOwnPropertyNames(err));
      console.log(err);
      console.log(err.stack);
      console.log(err.message);
      console.log(2321);
      process.exit();
      */
      throw err;
    } finally {
      _onHttpRequest = null;
    }
    return ret;
  }
}
