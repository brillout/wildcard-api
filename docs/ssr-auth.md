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
    <img src="/docs/images/logo-title.svg" height="105" alt="Wildcard API"/>
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
you need to manually bind the `context` object.

For example:

~~~js
// Node.js

const { server } = require('telefunc/server');

// Our endpoint function `whoAmI` needs the name of the logged-in user.
server.whoAmI = async function() {
  const {user} = this;
  return 'You are '+user.name;
};
~~~

~~~js
// Browser & Node.js (this code runs in the browser as well as in Node.js)

const { server } = require('telefunc/client');

// Whether the code runs in the browser or in Node.js
function isNodejs() {
  return typeof window === "undefined";
}

// `req` is the HTTP request object provided by your server
// framework (Express/Koa/Hapi/...).
async function(req) {
  let {whoAmI} = server;

  if( isNodejs() ){
    // When we call `whoAmI` in Node.js we need to manually
    // provide any HTTP request information that `whoAmI` needs.

    // We provide information about the logged-in user to our
    // endpoint function `whoAmI` by binding `req.user`:
    const {user} = req;
    whoAmI = whoAmI.bind({user});
  }

  const userName = await whoAmI();
  console.log("I am "+userName);
}
~~~

We now dissect an authentication example in order to showcase and explain:
- Where `req` comes from.
- Why Wildcard requires you to manually provide `req`.

Feel free to skip the example dissection if you already know where to get `req` from &mdash;
just remember to manually `bind` the context when doing SSR.

**Example Dissection**

Let's consider the endpoint `whoAmI` from above:

~~~js
// Node.js

const { server } = require('telefunc/server');

// Our endpoint function `whoAmI` needs the name of the logged-in user.
server.whoAmI = async function() {
  const {user} = this;
  return 'You are '+user.name;
};
~~~

And let's now dissect what happens when we call `whoAmI` in the browser:

~~~js
// Browser

// We use the Wildcard client in the browser
const { server } = require('telefunc/client');

(async () => {
  // Because we are on the browser, the Wildcard client makes an HTTP request to our Node.js server
  const userName = await server.whoAmI();

  console.log('Welcome to Wildcard, '+userName);
})();
~~~

The HTTP request that the Wildcard client made is handled by the Wildcard middleware:

~~~js
// Node.js

const express = require('express');
const {wildcard} = require('telefunc/server/express');

const app = express();

// Add the Wildcard middleware
app.use(wildcard(async req => {
  // The context object is available to endpoint functions as `this`.
  const context = {
    // Express authentication middlewares usually make user information available at `req.user`
    user: req.user,
  };
  return context;
}));
~~~

What happens here is:
- We call `whoAmI` in the browser.
- Wildcard makes an HTTP request to our Node.js server.
- The Wildcard middleware is called.
- Our context function adds `req.user` to `context`.
- Wildcard binds `context` to our endpoint function `whoAmI` (in other words `this===context` in the `whoAmI` function).
- The endpoint function `whoAmI` can access information about the logged-in user at `this.user`.

The key take away here is that it is the Wildcard middleware that provides `req.user` to our endpoint functions.

But when we call the endpoint `whoAmI` in Node.js,
our endpoint function `whoAmI` is directly called: no HTTP request is made.
This means that the Wildcard middleware is never called.

There is no way for Wildcard to get `req.user` &mdash; we have to manually `bind()` the `req.user` object:

~~~js
// Node.js

// We use the Wildcard client in Node.js
const { server } = require('telefunc/client');

module.exports = getGreeting;

async function getGreeting(
  // We see later where `req` comes from.
  req
) {

  // Because we are in Node.js, the Wildcard client directly calls
  // the endpoint function `whoAmI`. Wildcard doesn't have access to
  // `req.user` and we need to bind it ourselves:
  let whoAmI = server.whoAmI.bind({user: req.user});

  const userName = await whoAmI();

  return 'Welcome to Wildcard, '+userName;
}
~~~

You may wonder where `req` comes from.
The `req` object should be provided by your SSR tool
or, if you implemented SSR yourself,
by your server framework (Express/Koa/Hapi/...)
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
  // The `req` object is provided by Express

  // We pass `req` to `getGreeting`
  const message = await getGreeting({req});

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
  // We don't have to pass `req` when calling `getGreeting` in the
  // browser: Wildcard is about to make an HTTP request to our
  // Node.js server and the Wildcard middleware will be called.
  // The middleware passes `context.user` to our endpoint function
  // `whoAmI`.
  const message = await getGreeting();

  ReactDOM.hydrate(
    <div>{message}</div>,
    document.getElementsById('react-container')
  );
})();
~~~

That way, `whoAmI` has always access to the `req.user`:
when the client runs in the browser,
`this.user` originates from the Wildcard middleware,
and when the client runs in Node.js,
`this.user` originates from our `bind` call.

The isomorphic (aka universal) usage of the Wildcard client looks this:

~~~js
// Browser + Node.js

// /common/getGreeting.js

const { server } = require('telefunc/client');
const assert = require('assert');

module.exports = getGreeting;

// Whether the code runs in the browser or in Node.js
function isNodejs() {
  return typeof window === "undefined";
}

async function getGreeting ({req}) {
  let {whoAmI} = server;

  if( isNodejs() ) {
    // We need `req` when calling the endpoint in Node.js.
    assert(req);

    // We use `Function.prototype.bind()` to make `req.user`
    // available to the `whoAmI` endpoint function.
    whoAmI = whoAmI.bind({user: req.user});
  } else {
    // When run in the browser, there is no HTTP request yet.
    assert(!req);
  }

  const userName = await whoAmI();

  return 'Welcome to Wildcard, '+userName;
};
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
