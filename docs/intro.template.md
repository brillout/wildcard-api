!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path

<br/>

JavaScript library to create an API between your Node.js server and your browser frontend.

#### Contents

 - [What is Wildcard?](#what-is-wildcard)
 - Usage
   - [Installation & Setup](#installation--setup)
   - [Authentication](#authentication)
   - [Authorization](#authorization)
   - [Network Errors](#network-errors)
   - [SSR](#ssr)
   - [`onEndpointCall`](#onEndpointCall)
 - [More](#more)

<br/>


### What is Wildcard?

With Wildcard,
creating an API is as easy as creating JavaScript functions:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

// We define a `hello` function on the server
endpoints.hello = function(name) {
  return {message: 'Hi '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  // Wildcard makes our `hello` function available in the browser
  const {message} = await endpoints.hello('Daenerys');
  console.log(message); // Prints `Hi Daenerys`
})();
~~~

That's all Wildcard does:
it makes functions,
that are defined on the server,
"callable" in the browser.
Nothing more, nothing less.

How you retrieve/mutate data is up to you;
you can use any NoSQL/SQL/ORM query:

~~~js
const endpoints = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const Todo = require('./path/to/your/data/models/Todo');

endpoints.createTodo = async function(text) {
  const user = await getLoggedUser(this.headers); // We explain `this.headers` later

  // Abort if the user is not logged in
  if( !user ) return;

  // With ORM/ODM:
  const newTodo = new Todo({text, authorId: user.id});
  await newTodo.save();
  /* Or with SQL:
  const db = require('your-favorite-sql-query-builder');
  const [newTodo] = await db.query(
    "INSERT INTO todos VALUES (:text, :authorId);",
    {text, authorId: user.id}
  ); */

  return newTodo;
};
~~~

###### Wildcard VS REST/GraphQL

**REST** and **GraphQL** are tools to create a **_generic API_**:
your data can be retrieved and mutated in all kinds of ways.
The more data is retrievable/mutable, the better.
So that third parties can build all kinds of apps on top of your data.

**Wildcard** is a tool to create a **_custom API_**:
your data is retrieved and mutated by you and you only.
For example when your data is accessed only from your React/Vue frontend.

So:
if you want to expose your data to the world,
then use REST/GraphQL,
but if you merely want to access your data from your browser frontend,
then use Wildcard.

Wildcard is vastly simpler than REST/GraphQL:
all you need to know is written in this readme.

If you are a startup and
you want to quickly ship/evolve your product,
then Wildcard offers a very simple way.
(Wildcard is actually used by many startups.)



!INLINE ./snippets/section-footer.md --hide-source-path



### Installation & Setup

1. Add Wildcard to your Node.js server.

   With Express:
   ~~~js
   const express = require('express');
   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const app = express();

   app.all('/wildcard/*' , async (req, res) => {
     const {body, statusCode, type} = await getApiResponse(req);
     res.status(statusCode);
     res.type(type);
     res.send(body);
   });
   ~~~

   <details>
   <summary>
   With Hapi
   </summary>

   ~~~js
   const Hapi = require('hapi');
   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const server = Hapi.Server();

   server.route({
     method: '*',
     path: '/wildcard/{param*}',
     handler: async (request, h) => {
       const {body, statusCode, type} = await getApiResponse(request.raw.req);
       const resp = h.response(body);
       resp.code(statusCode);
       resp.type(type);
       return resp;
     }
   });
   ~~~
   </details>

   <details>
   <summary>
   With Koa
   </summary>

   ~~~js
   const Koa = require('koa');
   const Router = require('koa-router');
   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const app = new Koa();

   const router = new Router();

   router.all('/wildcard/*', async ctx => {
     const {body, statusCode, type} = await getApiResponse(ctx);
     ctx.status = apiResponse.statusCode;
     ctx.type = type;
     ctx.body = apiResponse.body;
   });

   app.use(router.routes());
   ~~~
   </details>

   <details>
   <summary>
   With other server frameworks
   </summary>

   Wildcard can be used with any server framework.
   Just make sure to reply HTTP requests made to `/wildcard/*`
   with an HTTP response with the HTTP body and status code returned by
   `const {body, statusCode, type} = await getApiResponse({method, url, headers});`
   where `method`, `url`, and `headers` are the HTTP request method, URL, and headers.
   </details>

2. Define functions
   in Node.js on
   `require('wildcard-api').endpoints` in Node.js.

   ~~~js
   // Node.js

   const {endpoints} = require('wildcard-api');
   const getLoggedUser = require('./path/to/your/auth/code');
   const getData = require('./path/to/your/data/retrieval/code');

   endpoints.myFirstEndpoint = async function () {
     // `this` is the object you pass to `getApiResponse`.
     // In the Express code above we passed `req`. Thus we can
     // access `req.headers.cookie` over `this.headers.cookie`.
     const user = await getLoggedUser(this.headers.cookie);
     const data = await getData(user);
     return data;
   };
   ~~~

3. You can now "call" your enpdoint functions in the browser
   at `require('wildcard-api/client').endpoints`.

   ~~~js
   // Browser

   import {endpoints} from 'wildcard-api/client'; // npm install wildcard-api

   (async () => {
     const data = await endpoints.myFirstEndpoint();
   })();
   ~~~

> If you want to play around with Wildcard, you can use
> [Reframe's react-sql starter](https://github.com/reframejs/reframe/tree/master/plugins/create/starters/react-sql#readme) to scaffold an app that has a Wildcard API.

!INLINE ./snippets/section-footer.md --hide-source-path



### Authentication

Any object `anObject` you pass to `getApiResponse(anObject)`
is made available to your endpoint functions as `this`.
(I.e. `this===anObject`.)
That way,
you can pass any request information to your endpoint functions,
such as HTTP headers.

For example, when using Express, you can pass express's `req` object:

~~~js
const {getApiResponse} = require('wildcard-api');

async (req, res) => {
  // We pass `req` to `getApiResponse` to make it available to our
  // endpoint functions
  const apiResponse = await getApiResponse(req);
  // ...
});
~~~

Your endpoint functions will then be able to access the HTTP headers:

~~~js
const {endpoints} = require('wildcard-api');
const getUserFromSessionCookie = require('./path/to/your/session/logic');

endpoints.getLoggedUserInfo = async function() {
  // Since `this===req`, `req.headers` is available as `this.headers`
  const user = await getUserFromSessionCookie(this.headers.cookie);
  return user;
};
~~~

Or when using Express with [Passport](https://github.com/jaredhanson/passport):

~~~js
const {endpoints} = require('wildcard-api');

endpoints.getLoggedUserInfo = async function() {
  // When using Passport, `req.user` holds information about the logged-in user.
  // Since `this===req`, `req.user` is available as `this.user`.
  return this.user;
};
~~~

!INLINE ./snippets/section-footer.md --hide-source-path



### Authorization

Permissions are defined by code. For example:

~~~js
const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const db = require('./path/to/your/db/handler');

endpoints.updateTodoText = async function(todoId, newText) {
  if( !user ) {
    // Not logged in user are not authorized to change a to-do item.
    // We abort.
    return;
  }

  const todo = await db.getTodo(todoId);

  if( !todo ) {
    // `todoId` didn't match any todo.
    // We abort.
  }

  if( todo.authorId !== user.id ) {
    // Only the author of the to-do item is allowed to modify it.
    // We abort.
    return;
  }

  // The user is authorized.
  // We commit the new to-do text.
  await db.updateTodoText(todoId, newText);
};
~~~

See the full todo list app example for further permission examples.

!INLINE ./snippets/section-footer.md --hide-source-path



### Network Errors

Wildcard uses the Fetch API
and doesn't catch any error thrown by `fetch()`,
allowing you to handle network errors as you wish.

You can also use [Handli](https://github.com/brillout/handli):

~~~js
import 'handli';
/* Or:
require('handli')`;
*/

// That's it: Handli automatically installs itslef with Wildcard.
// Wildcard will now use Handli for network errors.
~~~

!INLINE ./snippets/section-footer.md --hide-source-path



### SSR

The Wildcard client is universal and works on both the browser and Node.js.

SSR works out of the box.

But with one exception:
if your endpoint functions need request information,
then you'll need to `bind()` the request object.

Most notably when you have authentication/authorization, then you'll need to `bind()`.

For example:

~~~js
// Node.js

const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');

endpoints.whoAmI = async function() {
  // This endpoint requires the HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  return 'You are '+user.name;
};
~~~

The `whoAmI` endpoint always
(when the Wildcard client runs in the browser as well as when the Wildcard client runs in Node.js)
needs the HTTP headers.

We need to provide that request information while doing SSR:

~~~js
// Browser + Node.js

const {endpoints} = require('wildcard-api/client');

// `req` should be the HTTP request object. (Provided by your server framework.)
module.exports = async req => {
  let {whoAmI} = endpoints;

  if( isNodejs() ) {
    // We use `Function.prototype.bind()` to pass the
    // request object `req` to our endpoint `whoAmI`.
    whoAmI = whoAmI.bind(req);
  }

  const userName = await whoAmI();
};

function isNodejs() {
  return typeof window === "undefined";
}
~~~

That way, `whoAmI` always has access to the request object `req`:
when run in the browswer,
`req` originates from `getApiResponse`,
and when run in Node.js,
`req` originates from our `bind` call above.
Our endpoint function can now always as `this`.
The request object `req` is then always available to `whoAmI` as `this`.

(When used in the browser, the Wildcard client makes an HTTP request to your server which calls `getApiResponse`.
But when used in Node.js, the Wildcard client directly calls your endpoint function, without doing any HTTP request.
That's why you need to `bind()` the request object.)

> You can scaffold an app that has SSR + Wildcard by using
> [Reframe's react-sql starter](https://github.com/reframejs/reframe/tree/master/plugins/create/starters/react-sql#readme)

!INLINE ./snippets/section-footer.md --hide-source-path



### `onEndpointCall`

TODO

!INLINE ./snippets/section-footer.md --hide-source-path



### More

This section collects further information about Wildcard.

 - [How does it work](/docs/how-does-it-work.md)
   Explains how Wildcard works.

 - [Conceptual FAQ](/docs/conceptual-faq.md)
   High level discussion about Wildcard, RPC-like APIs, GraphQL, and REST.

 - [Custom VS Generic](/docs/custom-vs-generic.md)
   Goes into more depth of whether you should implement a generic API (REST/GraphQL) or a custom API (Wildcard).
   (Or both.)
   In general, the rule of thumb for deciding which one to use is simple:
   if third parties need to access your data,
   then implement a generic API,
   otherwise implement a custom API.
   But in some cases it's not that easy and this document goes into more depth.

!INLINE ./snippets/section-footer.md --hide-source-path



