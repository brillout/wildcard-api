const puppeteer = require('puppeteer');

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

  await page.goto('http://localhost:3000');

  return {
    browser,
    browserEval,
  };

  async function browserEval(fn, {offlineMode=false}={}) {
    await page.setOfflineMode(offlineMode);
    return page.evaluate(fn);
  }
}
