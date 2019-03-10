const Bundler = require('parcel-bundler');
const bundler = new Bundler(__dirname + '/index.html', {watch: false, logLevel: 2});

module.exports = bundle;

async function bundle() {
  await bundler.bundle();
}
