!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path

<br/>

 - [What is Wildcard](#what-is-wildcard)
 - [Wildcard VS REST/GraphQL](#wildcard-vs-restgraphql)
 - Usage
   - [Getting Started](#getting-started)
   - [Authentication](#authentication)
   - [Permissions](#permissions)
   - [Error Handling](#error-handling)
   - [SSR](#ssr)
 - [More Resources](#more-resources)

<br/>

### What is Wildcard

Wildcard is a JavaScript library to create an **API** for your **Node.js** server that is consumed by the **browser**.

With Wildcard,
creating an API is as easy as creating JavaScript functions:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

// We define a `hello` function on the server
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  // Wildcard makes our `hello` function available in the browser
  const {message} = await endpoints.hello('Daenerys');
  console.log(message); // Prints `Welcome Daenerys`
})();
~~~

That's all Wildcard does:
it makes functions,
that are defined on the server,
"callable" in the browser.
Nothing more, nothing less.

How you retrieve/mutate data is up to you;
you can use any SQL/NoSQL/ORM query:

~~~js
// Node.js server

const endpoints = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const Todo = require('./path/to/your/data/model/Todo');

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

!INLINE ./snippets/section-footer.md #readme --hide-source-path



### Wildcard VS REST/GraphQL

If all you need is to retrieve/mutate data from you frontend,
then Wildcard offers a very easy way.
All you have to do is to create JavaScript functions
and all you need to know is written in this little Readme.

If you need third parties to be able to retrieve/mutate your data
then REST and GraphQL are better suited.
A RESTful/GraphQL API has a schema and a rigid structure which is a good thing for third parties that need a stable and long-term contract with your API.

But,
for quickly evolving your application,
the rigid structure of a RESTful/GraphQL API gets in a way and is a handicap.
Wildcard,
on the other hand,
is schemaless and structureless
which is a wonderful fit for rapid development, prototyping, and MVPs.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



### Getting Started

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
   `require('wildcard-api').endpoints`.

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

!INLINE ./snippets/section-footer.md #readme --hide-source-path




### Authentication

To do authentication you need the HTTP headers such as the `Authorization: Bearer AbCdEf123456` Header or a cookie holding the user's session ID.

For that you pass the request object `req` to `getApiResponse(req)`:
This request object `req` is provided by your server framework (express/koa/hapi)
and holds information about the HTTP request such as the HTTP headers.

For example with Express:

 ~~~js
 app.all('/wildcard/*' , async (req, res) => {
   // We pass `req` to getApiResponse
   const {body, statusCode, type} = await getApiResponse(req);
   res.status(statusCode);
   res.type(type);
   res.send(body);
 });
~~~

Wildcard then makes `req` available to your endpoint function as `this`.

For example:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');
const getUserFromSessionCookie = require('./path/to/your/session/logic');

endpoints.getLoggedUserInfo = async function() {
  // Since `this===req`, `req.headers` is available as `this.headers`
  const user = await getUserFromSessionCookie(this.headers.cookie);
  return user;
};
~~~

In general, any object `anObject` you pass to `getApiResponse(anObject)`
is made available to your endpoint functions as `this`.
(I.e. `this===anObject`.)
That way,
you can make whatever you want available to your endpoint functions.

!INLINE ./snippets/section-footer.md #readme --hide-source-path




### Permissions

Permissions are defined by code. For example:

~~~js
// Node.js server

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

See the [to-do list app example](/example/) for further permission examples.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



### Error Handling

Calling an endpoint throws an error when:
 - The browser cannot connect to the server. (The user is offline or your server is down.)
 - The endpoint function throws an uncaught error

An uncaught error is considered a bug:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

endpoints.brokenHello = function() {
  // There is a bug in `hi` and an uncaught error will be thrown.
  return hi();
};

function brokenFunction() {
  // Typo: `retrn` instead of `return`
  retrn 'Hey there';
}
~~~


If you use a library that throws expected errors, then catch them:

~~~js
~~~

In general, validation should be down like this:

~~~js

~~~


The error thrown when caling an enpdoint has two attributes `isNetworkError` and `isServerError`:

~~~js
~~~






Calling an endpoint throws an error when the endpoint returned value couldn't be retrieved.

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  let err;
  try {
    await endpoints.hello();
  } catch(err_) {
    err = err_;
  }
  if( err ){
    alert('Something went wrong');
  }
})();
~~~

This happens when
the browser couldn't connect to the server (the user is offline or your server is down)

This can also happen if an error is thrown and not caught while calling the endpoint function.

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

endpoints.hello = function() {
  throw new Error();
};
~~~

your endpoint throwns

or when the endpoint function throws an uncaught exception.

When the browser is offline:
 - An uncaught exception has been thrown while calling the endpoint function.
 the endpoint function throws an uncaught exception.

More precisely, there are 2 situations
When trying to call an endpoint 

If your endpoint function throws an error:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

endpoints.hello = function() {
  throw new Error();
};
~~~

and you try to call the endpoint in the browser, the following happens:

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';
import assert from 'assert';

(async () => {
  try {
    await endpoints.hello();
  } catch(err_) {
    err = err_;
  }
  assert(err);
  assert(err.isServerError===true);
})();
~~~

### Error Handling

This is what you need to know to handle errors:
- On the server, your endpoint functions should catch expected errors and shouldn't catch unexpected errors (aka bugs).
- In the browser, calling an endpoint throws an error if the user is offline or if the endpoint function throws an uncaught error (that is, there is a bug).

cannot connect to the server or  endpoint didn't work. This happens when  when your endpoint function 
`err` with `err.isServerError===true` if the endpoint function throws an uncaught error (in other words there is a bug), and will throw an error with `err.isNetworkError===true` if the browser couldn't connect to the server.

Upon validation error, your endpoint function should not throw an exception.
(A validation error is an expected error and not a bug.)
For example:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');
const isStrongPassword = require('./path/to/isStrongPassword.js');

endpoints.createAccount = async function({email, password}) {
  /* Don't do the following:
  if( !isStrongPassword(password) ){
    throw new Error("Password is too weak.");
  }
  */

  // Do this instead:
  if( !isStrongPassword(password) ){
    return {validationError: "Password is too weak."};
  }

  /* ... */
};
~~~

If you use a library that throws expected errors, then catch them:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');
const validatePasswordStrength = require('./path/to/validatePasswordStrength.js');

endpoints.createAccount = async function({email, password}) {
  // `validatePasswordStrength` is expected to throw an error if `password` is too weak.
  // You should always catch such expected errors.
  let err;
  try {
    validatePasswordStrength(password);
  } catch(err_) {
    err = err_
  }

  if( err ) {
    return {validationError: "Password is too weak."};
  }

  /* ... */
};
~~~

You shouldn't catch unexpected errors (aka bugs):

~~~js
~~~

Not catching the bug allows you to handle the bug in the browser:

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  let message;
  let err;
  try {
    message = await endpoints.brokenHello();
  } catch(err_) {
    err = err_;
  }

  if( err ){
    alert("Oops... That didn't work.");
  } else {
    alert('The message is: '+message);
  }
})();
~~~

And, with `isServerError` and `isNetworkError`, you can handle errors with more precision:

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

async function() {
  let data;
  let err;
  try {
    data = await endpoints.getData();
  } catch(err_) {
    err = err_;
  }

  if( err.isServerError ){
    // This is when the `getData` endpoint function throws an uncaught error.
    alert(
      'Something went wrong on our side. We have been notified and we are working on a fix.' +
      'Sorry... Please try again.'
    );
    return {success: false};
  }
  if( err.isNetworkError ){
    // This is when the browser couldn't connect to the server.
    // In other words, when the server is down or when the browser is offline.
    alert("We couldn't perform your request. Please try again.");
  }

  if( err ) {
    return {success: false};
  } else {
    return {success: true, data};
  }
}
~~~

You can also use [Handli](https://github.com/brillout/handli) which will automatically handle all errors for you:

~~~js
// Browser

import 'handli';
/* Or:
require('handli')`;
*/

// That's it: Handli automatically installs itslef.
// All errors are now handled by Handli.
~~~

!INLINE ./snippets/section-footer.md #readme --hide-source-path





### SSR

The Wildcard client is isomorphic/universal and works in both the browser and Node.js.

If you don't need Authentication, then SSR works out of the box.

If you need Authentication, then read [SSR & Authentication](/docs/ssr-auth.md#readme).

!INLINE ./snippets/section-footer.md #readme --hide-source-path





### More Resources

This section collects further information about Wildcard.

 - [SSR & Authentication](/docs/ssr-auth.md#readme)
   <br/>
   How to use Wildcard with SSR and Authentication.

 - [How it work](/docs/how-it-work.md#readme)
   <br/>
   Explains how Wildcard works.

 - [Conceptual FAQ](/docs/conceptual-faq.md#readme)
   <br/>
   High level discussion about Wildcard, RPC-like APIs, GraphQL, and REST.

 - [To-do List Example](/example#readme)
   <br/>
   An example of a to-do list app implemented with Wildcard.

 - [Custom VS Generic](/docs/custom-vs-generic.md#readme)
   <br/>
   Goes into depth of whether you should implement a generic API (REST/GraphQL) or a custom API (Wildcard).
   (Or both.)
   In general, the rule of thumb for deciding which one to use is simple:
   if third parties need to access your data,
   then implement a generic API,
   otherwise implement a custom API.
   But in some cases it's not that easy and this document goes into more depth.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



