!INLINE ./header.md --hide-source-path
&nbsp;


# SSR & Authentication

SSR works out of the box.

But with one exception:
if your endpoint functions need the HTTP request headers,
then you'll need to manually provide the headers while doing SSR.

Most notably for authentication/authorization: your endpoint functions need the HTTP cookie header (or the HTTP authentication header).

For example:

~~~js
// Node.js (this code always runs in Node.js)

const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');

endpoints.whoAmI = async function() {
  // This endpoint requires the HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  return 'You are '+user.name;
};
~~~

When the Wildcard client runs in the browser, then Wildcard automatically provides the HTTP headers to your endpoint functions.
But when the Wildcard client runs in Node.js, you'll have to manually provide the HTTP headers:

~~~js
// Browser & Node.js (this code runs in the browser as well as in Node.js)

const {endpoints} = require('wildcard-api/client');
const assert = require('assert');

module.exports = getGreeting;

async function getGreeting({headers}) {
  let {whoAmI} = endpoints;

  if( isNodejs() ) {
    // You should pass the HTTP headers to `getGreeting` when run in Node.js
    assert(headers);

    // We use `Function.prototype.bind()` to make the headers
    // available to the `whoAmI` endpoint function
    whoAmI = whoAmI.bind({headers});
  }

  const userName = await whoAmI();

  return 'Welcome to Wildcard, '+userName;
};

// Whether the code runs in the browser or in Node.js
function isNodejs() {
  return typeof window === "undefined";
}
~~~

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
and,
when run in Node.js,
`req` originates from our `bind` call above.

If you wonder why Wildcard works that way:
when the Wildcard client is used in the browser,
an HTTP request is made to your Node.js server and the HTTP headers are passed to Wildcard's `getApiResponse`.
Wildcard has access to the HTTP headers and can provide the headers to your endpoint functions.
But,
when the Wildcard client is used in Node.js,
your endpoint functions are directly called.
There is no way for Wildcard to get the HTTP headers and that's why you need to manually `bind()` the headers.
