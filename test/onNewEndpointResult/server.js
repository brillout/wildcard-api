process.on('unhandledRejection', err => {throw err});

const assert = require('reassert');
global.assert = assert;
const {WildcardApi} = require('../../');
const puppeteer = require('puppeteer');
const glob = require('glob');
const tests = glob


const startServer = require('../startServer');

const Bundler = require('parcel-bundler');
const bundler = new Bundler(__dirname + '/index.html', {watch: false, logLevel: 2});

(async () => {
  await bundler.bundle();

  const wildcardApiHolder = {};

  const testFiles = glob.sync( './tests/*.js' );
  testFiles.forEach(function(file) {
    const tests = require(file);
    tests.forEach(async testFn => {
      wildcardApiHolder.wildcardApi = WildcardApi();
      await testFn(WildcardApi, {browserEval});
    });
  });

  const server = await startServer(__dirname+'/dist/', wildcardApiHolder);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  console.log('beg');
  await page.evaluate(async () => {
    console.log('evv');
    const msg = window.endpoints.hello();
    console.log('msg server', msg);
  });

//page.on('console', consoleObj => console.log(consoleObj.text()));

	const aHandle = await page.evaluateHandle('document'); // Handle for the 'document'

/*
  console.log('w',aHandle.documentElement);

	const eb = await page.evaluateHandle('endpoints'); // Handle for the 'document'
	console.log('eb',eb);
	console.log(eb.hello);
*/


//*
  const dimensions = await page.evaluate(async () => {
    const res = await endpoints.hello();
    console.error(1111);
    console.error(222);
    console.error(333);
    console.error(35);
    assert(res==='world', 'euiqwhe','a','b');
    return res;
  });
  console.log('Dimensions:', dimensions);
//*/

  console.log('fin');

  await browser.close();

  await server.stop();
})();
