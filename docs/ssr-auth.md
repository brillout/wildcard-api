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
    <img src="https://github.com/reframejs/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=106 alt="Wildcard API"/>
  </a>
</p>
&nbsp;

# SSR & Authentication

SSR (Server-Side Rendering) denotes the practice of rendering a page twice:
once to HTML in Node.js and then again to the DOM in the browser.

> :warning:
> This document is meant for people that want to use Wildcard with SSR.
> If you don't know what SSR is then
> you are most likely not doing it.
> If you don't do SSR,
> you can use Wildcard without reading this document.

SSR works out of the box.
But with one exception:
when calling an endpoint in Node.js,
you need to manually provide any HTTP request information
your endpoint function may need.

For example:

~~~js
// Node.js

const {endpoints} = require('wildcard-api');
const getUser = require('./path/to/our/auth-code/getUser');

endpoints.whoAmI = async function() {
  // Our endpoint function `whoAmI` needs the HTTP headers.
  const user = await getUser(this.headers.cookie);
  return 'You are '+user.name;
};
~~~

~~~js
// Browser & Node.js (this code runs in the browser as well as in Node.js)

const {endpoints} = require('wildcard-api/client');

// Whether the code runs in the browser or in Node.js
function isNodejs() {
  return typeof window === "undefined";
}

// `req` is the HTTP request object provided by Express/Koa/Hapi/...
async function(req) {
  let {whoAmI} = endpoints;

  if( isNodejs() ){
    // When we call `whoAmI` in Node.js we need
    // to manually provide any HTTP request information that
    // `whoAmI` needs.

    // For example here, we provide the HTTP headers to our
    // endpoint function `whoAmI` by binding `headers`
    // to it.
    // The `whoAmI` endpoint function can then
    // access the HTTP headers at `this.headers`.
    const {headers} = req;
    whoAmI = whoAmI.bind({headers});
  }

  await whoAmI();
}
~~~

We now showcase an authentication example that:
- Illustrates where `req` comes from.
  <br/>
  Where `req` comes from depends on what SSR tool you are using.
  (Or if you don't use any SSR tool, how you implement SSR.)
  If you know where to get `req` from then you can skip reading the example.
- Explains why Wildcard requires you to manually provide `req`.
  <br/>
  You may wonder why Wildcard requires you to provide `req` when calling an endpoint
  in Node.js but doesn't require you to do so when calling an endpoint in Node.js.
  If you are curious why that is, then read on.
  Otherwise you can skip reading the example.

# Example

Let's re-consider the endpoint `whoAmI` from above:

~~~js
// Node.js

const {endpoints} = require('wildcard-api');
const getUser = require('./path/to/our/auth-code/getUser');

endpoints.whoAmI = async function() {
  // Our endpoint function `whoAmI` needs the HTTP headers.
  const user = await getUser(this.headers.cookie);
  return 'You are '+user.name;
};
~~~

Let's now dissect what happens when we call `whoAmI` in the browser:

~~~js
// Browser

// We use the Wildcard client in the browser
const {endpoints} = require('wildcard-api/client');

(async () => {
  // Because we are on the browser, the Wildcard client makes an HTTP request to our Node.js server
  const userName = await endpoints.whoAmI();

  console.log('Welcome to Wildcard, '+userName);
})();
~~~

The HTTP request that the Wildcard client made is then handled by the following function `wildcardHandler`:

~~~js
// Node.js

const {getApiResponse} = require('wildcard-api');

app.all('/wildcard/*', wildcardHandler);

async function wildcardHandler(req, res) {
  const requestProps = {
    url: req.url,
    method: req.method,
    body: req.body,

    // We pass the HTTP headers to `getApiResponse`.
    // Our endpoint function `whoAmI` can then access the headers at `this.headers`.
    headers: req.headers,
  };
  const responseProps = await getApiResponse(requestProps);

  res.status(responseProps.statusCode);
  res.type(responseProps.contentType);
  res.send(responseProps.body);
}
~~~

What happens here is:
- We call `whoAmI` in the browser.
- Wildcard makes an HTTP request to our Node.js server.
- Our `wildcardHandler` function is called.
- We add `req.headers` to `requestProps`.
- We pass `requestProps` to `getApiResponse`.
- Wildcard binds `requestProps` to our endpoint function `whoAmI` (in other words `this===requestProps` in the `whoAmI` function).
- The endpoint function `whoAmI` can access the HTTP headers at `this.headers`.

The key take away here is that it is our `wildcardHandler` function that provides `req.headers`.

But when we call the endpoint `whoAmI` in Node.js,
our endpoint function `whoAmI` is directly called: no HTTP request is made.
This means that `getApiResponse` is never called.

There is no way for Wildcard to get the HTTP headers &mdash; we have to manually `bind()` the headers:

~~~js
// Node.js

// We use the Wildcard client in Node.js
const {endpoints} = require('wildcard-api/client');

module.exports = getGreeting;

async function getGreeting({
  // We see later where `headers` comes from.
  headers,
}) {

  // Because we are in Node.js, the Wildcard client directly calls
  // the endpoint function `whoAmI`.
  // Wildcard doesn't have access to any HTTP headers and we need to bind some `headers` ourselves:
  let whoAmI = endpoints.whoAmI.bind({headers});

  const userName = await whoAmI();

  return 'Welcome to Wildcard, '+userName;
}
~~~

You may now wonder where does `headers` come from.
The `headers` should be provided by your SSR tool.
And, when you implement SSR yourself,
the `headers` comes from Express/Koa/Hapi/...
which we now showcase.

In a custom SSR implementation,
you'd call `getGreeting` like this:

~~~js
// Node.js

const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const getGreeting = require('../common/getGreeting');

const app = express();

app.get('/hello' , async (req, res) => {
  // The `headers` object is provided by Express
  const {headers} = req;

  // We pass `headers` to `getGreeting`
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
// Browser

import React from 'react';
import ReactDOM from 'react-dom';
import getGreeting from '../common/getGreeting';

(async () => {
  // We don't have to pass `headers` here.
  // (And actually, the HTTP request doesn't even exist yet.
  // Wildcard is about to make the HTTP request to our Node.js server,
  // which will be handled by `wildcardHandler` that will pass the
  // `headers` object to `getApiResponse`.)
  const message = await getGreeting();

  ReactDOM.hydrate(
    <div>{message}</div>,
    document.getElementsById('react-container')
  );
})();
~~~

That way, `whoAmI` has always access to the headers:
when the client runs in the browser,
`headers` originates from `getApiResponse`,
and when the client run in Node.js,
`headers` originates from our `bind` call.


To sum up,
we show the
isomorphic (aka universal) usage of the Wildcard client:

~~~js
// Browser + Node.js

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
    // We should pass the HTTP headers to `getGreeting` when run in Node.js.
    assert(headers);

    // We use `Function.prototype.bind()` to make the headers
    // available to the `whoAmI` endpoint function.
    whoAmI = whoAmI.bind({headers});
  } else {
    // When run in the browser, there is no `headers` (yet).
    assert(!headers);
  }

  const userName = await whoAmI();

  return 'Welcome to Wildcard, '+userName;
};
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you have questions or if something is not clear. We enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>




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
