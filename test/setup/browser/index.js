require('babel-polyfill');
const {endpoints} = require('../../../client');
const assert = require('reassert');

Object.assign(window, {endpoints, assert});

(async () => {
  const result = await endpoints.hello();
  document.body.innerHTML = '<b>'+result+'</b>';
  console.log('result from browser', result);
})();
