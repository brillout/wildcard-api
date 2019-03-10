const puppeteer = require('puppeteer');

module.exports = launchBrowser;

async function launchBrowser() {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  page.on('console', consoleObj => console.log(consoleObj.text()));
  await page.goto('http://localhost:3000');
  const browserEval = page.evaluate.bind(page);

  return {browser, browserEval};
}
