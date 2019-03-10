process.on('unhandledRejection', err => {throw err});

const wildcardApi = require('../../').WildcardApi();
const puppeteer = require('puppeteer');


wildcardApi.endpoints.hello = function() { return 'world' };

const startServer = require('../startServer');

const Bundler = require('parcel-bundler');
const bundler = new Bundler(__dirname + '/index.html');

(async () => {
  await bundler.bundle();
  const stop = await startServer(__dirname+'/dist/', wildcardApi);

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
    assert(res==='world1', 'euiqwhe','a','b');
    return res;
  });
  console.log('Dimensions:', dimensions);
//*/


  console.log('fin');

  await browser.close();

//await stop();
})();
