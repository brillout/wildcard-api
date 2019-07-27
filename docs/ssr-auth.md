<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/reframejs/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=80 alt="Wildcard API"/>
  </a>
</p>

<p align="center">JavaScript Functions as API.</p>
&nbsp;


# SSR & Authentication

SSR works out of the box.

But if your endpoint functions need HTTP request information,
such as the HTTP request headers,
then you'll have to manually provide that information upon server-side rendering.

For example, for authentication & authorization, your endpoint functions will most likely need the HTTP request headers:

~~~js
// Node.js

const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');

endpoints.whoAmI = async function() {
  // This endpoint function requires the HTTP headers.
  const user = await getLoggedUser(this.headers.cookie);
  return 'You are '+user.name;
};
~~~

When the Wildcard client runs in the browser,
Wildcard provides the `requestProps` you pass to `getApiResponse` to your endpoint functions:

~~~js
// Node.js

app.all('/wildcard/*' , async (req, res) => {
  const requestProps = {
    url: req.url,
    method: req.method,
    body: req.body,
    // We pass the `headers` object
    headers: req.headers,
  };
  // All `requestProps` are available to your endpoint functions.
  // For example, `whoAmI` can access `req.headers.cookie` over `this.headers.cookie`.
  const responseProps = await getApiResponse(requestProps);
  res.status(responseProps.statusCode);
  res.type(responseProps.contentType);
  res.send(responseProps.body);
});
~~~

When the Wildcard client is used in the browser,
an HTTP request is made to your Node.js server and the HTTP headers are passed to Wildcard's `getApiResponse`.
Wildcard has access to the HTTP headers and can provide the headers to the endpoint function `whoAmI`.

~~~js
// Browser (this code never runs in Node.js)

// We use the Wildcard client in the browser
const {endpoints} = require('wildcard-api/client');

(async () => {
  // Because we are on the browser, the Wildcard client makes an HTTP request.

  // We don't have to do anything, since `whoAmI` has access
  // to `getApiResponse`'s `requestProps.headers`:
  const userName = await endpoints.whoAmI();

  console.log('Welcome to Wildcard, '+userName);
})();
~~~

But,
when the Wildcard client is used in Node.js,
your endpoint functions are directly called, no HTTP request is made, and `getApiResponse` is never called.
There is no way for Wildcard to get the HTTP headers &mdash; you have to manually `bind()` the headers:

~~~js
// Node.js (this code never runs in the browser)

// We use the Wildcard client on Node.js
const {endpoints} = require('wildcard-api/client');

module.exports = async ({headers}) => {
  // Because we are on Node.js, the Wildcard client directly calls
  // the endpoint function (without doing any HTTP request).

  // Wildcard doesn't have access to the headers and we need to bind `headers`:
  let whoAmI = endpoints.whoAmI.bind({headers}); // (We see later where `headers` comes from.)

  const userName = await whoAmI();

  return 'Welcome to Wildcard, '+userName;
};
~~~

To have isomorphic (aka universal) code you can do this:

~~~js
// Browser & Node.js (this code runs in the browser as well as in Node.js)

// /common/getGreeting.js

const {endpoints} = require('wildcard-api/client');
const assert = require('assert');

module.exports = getGreeting;

// Whether the code runs in the browser or in Node.js
function isNodejs() {
  return typeof window === "undefined";
}

async function getGreeting ({headers}) {
  let {whoAmI} = endpoints;

  if( isNodejs() ) {
    // You should pass the HTTP headers to `getGreeting` when run in Node.js.
    assert(headers);

    // We use `Function.prototype.bind()` to make the headers
    // available to the `whoAmI` endpoint function.
    whoAmI = whoAmI.bind({headers});
  } else {
    // When run in the browser, passing `headers` to getGreeting is superfluous.
    assert(!headers);
  }

  const userName = await whoAmI();

  return 'Welcome to Wildcard, '+userName;
};
~~~

You'd then call `getGreeting` like this:

~~~js
// Node.js (this code runs in Node.js only)

const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const getGreeting = require('../common/getGreeting');

const app = express();

app.get('/hello' , async (req, res) => {
  const {headers} = req;

  const message = await getGreeting({headers});

  res.send(`
    <html>
      <body>
        <div id='react-container'>${
          ReactDOMServer.renderToStaticMarkup(
            <div>{message}</div>
          )
        }</div>
      </body>
    </html>
  `);
});
~~~

~~~js
// Browser (this code runs in the browser only)

import React from 'react';
import ReactDOM from 'react-dom';
import getGreeting from '../common/getGreeting';

(async () => {
  const message = await getGreeting();

  ReactDOM.hydrate(
    <div>{message}</div>,
    document.getElementsById('react-container')
  );
})();
~~~

That way, `whoAmI` has always access to the headers.

When the client runs in the browser,
`headers` originates from `getApiResponse`,
and when run in Node.js,
`headers` originates from our `bind` call.


<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/ssr-auth.template.md` and run `npm run docs` (or `yarn docs`).






-->
