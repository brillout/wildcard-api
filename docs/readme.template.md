!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path

<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[What is Wildcard](#what-is-wildcard)
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Wildcard compared to REST and GraphQL](#wildcard-compared-to-REST-and-GraphQL)
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Learning Material](#learning-material)
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
Usage
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Getting Started](#getting-started)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Authentication](#authentication)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Permissions](#permissions)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Error Handling](#error-handling)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[SSR](#ssr)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Options](#options)

<br/>

## What is Wildcard

Wildcard is a JavaScript library to create an API between your Node.js server and your frontend.

With Wildcard,
creating an API endpoint is as easy as creating a JavaScript function:

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
  const {message} = await endpoints.hello('Elisabeth');
  console.log(message); // Prints `Welcome Elisabeth`
})();
~~~

That's all Wildcard does:
it makes functions,
that are defined on your Node.js server,
callable in the browser.
Nothing more, nothing less.

How you retrieve and mutate data is up to you.
You can, for example, use SQL/ORM queries:

~~~js
// Node.js server

const endpoints = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  const user = await getLoggedUser(this.headers); // We talk about `this` later.

  if( !user ) {
    // The user is not logged-in. We abort.
    // (This is basically how you define permissions with Wildcard
    // which we talk more about in the "Permissions" section.)
    return;
  }

  // With an ORM:
  const newTodo = new Todo({text, authorId: user.id});
  await newTodo.save();

  /* Or with SQL:
  const db = require('your-favorite-sql-query-builder');
  const [newTodo] = await db.query(
    "INSERT INTO todos VALUES (:text, :authorId);",
    {text, authorId: user.id}
  );
  */

  return newTodo;
};
~~~

Wildcard is used in production at several projects,
every release is assailed against a heavy suit of automated tests,
its author is responsive,
and issues are fixed within 1-2 days.


## Wildcard compared to REST and GraphQL

REST and GraphQL are wonderful tools to create an API for large projects with many third-party developers.
Facebook's API, for example, is used by ~200k third parties.
It is no surprise that Facebook is using (and invented) GraphQL;
a GraphQL API enables
third-party developers
to extensively access Facebook's social graph
and build all kinds of applications.
For an API used by that many third parties,
GraphQL is the fitting tool.

But
for small to medium-sized projects
[RPC](/docs/what-is-rpc.md#what-is-rpc), such as Wildcard, is often enough.

RPC especially excels in prototyping.
A prototype usually needs only few API endpoints &mdash; RPC enables you to quickly implement, deliver, and evolve an MVP.
As you scale, you progressively replace your RPC endpoints with a RESTful or GraphQL API.

And, once you have scaled, you will know better whether you should go for REST or GraphQL.
Deciding whether to use REST or GraphQL for an architecture that doesn't exist yet is difficult at best, if not impossible.
You can start with RPC today and decide later whether to use REST or GraphQL.

You can use [RPC as default](/docs/blog/rpc-as-default.md#rpc-as-default) and
use REST and GraphQL only after the need arises.


## Getting Started

1. Install Wildcard.

   With Express:
   ~~~js
   // Node.js server

   const express = require('express');
   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const app = express();

   // Parse the HTTP request body
   app.use(express.json());

   app.all('/wildcard/*' , async (req, res) => {
     // `getApiResponse` requires the HTTP request `url`, `method`, and `body`.
     const requestProps = {
       url: req.url,
       method: req.method,
       body: req.body,
     };

     // The `requestProps` object is available in your endpoint functions
     // as `this`; you can use `requestProps` to make further request information
     // available to your endpoint functions, such as the HTTP headers:
     requestProps.headers = req.headers;

     const responseProps = await getApiResponse(requestProps);
     res.status(responseProps.statusCode);
     res.type(responseProps.contentType);
     res.send(responseProps.body);
   });
   ~~~

   <details>
   <summary>
   With Hapi
   </summary>

   ~~~js
   // Node.js server

   const Hapi = require('hapi');
   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const server = Hapi.Server();

   server.route({
     method: '*',
     path: '/wildcard/{param*}',
     handler: async (request, h) => {
       // `getApiResponse` requires the HTTP request `url`, `method`, and `body`.
       const requestProps = {
         url: request.url,
         method: request.method,
         body: request.payload,
       };

       // The `requestProps` object is available in your endpoint functions
       // as `this`; you can use `requestProps` to make further request information
       // available to your endpoint functions, such as the HTTP headers:
       requestProps.headers = request.headers;

       const responseProps = await getApiResponse(requestProps);
       const response = h.response(responseProps.body);
       response.code(responseProps.statusCode);
       response.type(responseProps.contentType);
       return response;
     }
   });
   ~~~
   </details>

   <details>
   <summary>
   With Koa
   </summary>

   ~~~js
   // Node.js server

   const Koa = require('koa');
   const Router = require('koa-router');
   const bodyParser = require('koa-bodyparser');
   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const app = new Koa();

   // Parse the HTTP request body
   app.use(bodyParser());

   const router = new Router();

   router.all('/wildcard/*', async ctx => {
     // `getApiResponse` requires the HTTP request `url`, `method`, and `body`.
     const requestProps = {
       url: ctx.url,
       method: ctx.method,
       body: ctx.request.body,
     };

     // The `requestProps` object is available in your endpoint functions
     // as `this`; you can use `requestProps` to make further request information
     // available to your endpoint functions, such as the HTTP headers:
     requestProps.headers = ctx.request.headers;

     const responseProps = await getApiResponse(requestProps);
     ctx.status = responseProps.statusCode;
     ctx.body = responseProps.body;
     ctx.type = responseProps.contentType;
   });

   app.use(router.routes());
   ~~~
   </details>

   <details>
   <summary>
   With other server frameworks
   </summary>

   Wildcard can be used with any server framework.
   All you have to do is to reply all HTTP requests made to `/wildcard/*`
   with `getApiResponse`:
   ~~~js
   // Node.js server

   // This is generic pseudo code for how to integrate Wildcard with any server framework.

   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const {addRoute, HttpResponse} = require('your-favorite-server-framework');

   // Add a new route `/wildcard/*` to your server
   addRoute(
     '/wildcard/*',
     async ({req}) => {
       // We assume that your server framework provides an object holding
       // information about the request. We denote this object `req`.

       // `getApiResponse` requires the HTTP request `url`, `method`, and `body`.
       const requestProps = {
         url: req.url, // The HTTP request url (or pathname)
         method: req.method, // The HTTP request method (`GET`, `POST`, etc.)
         body: req.body, // The HTTP request body
       };

       // The `requestProps` object is available in your endpoint functions
       // as `this`; you can use `requestProps` to make further request information
       // available to your endpoint functions, such as the HTTP headers:
       requestProps.headers = req.headers;

       // We get the HTTP response body, HTTP status code, and the body's content type.
       const responseProps = await getApiResponse(requestProps);
       const {body, statusCode, contentType} = responseProps;

       // We assume that server framework provides a way to create an HTTP response
       // upon `body`, `statusCode`, and `contentType`.
       const response = new HttpResponse({body, statusCode, contentType});
       return response;
     }
   );
   ~~~
   </details>

2. Define an endpoint function `endpoints.myFirstEndpoint`:

   ~~~js
   // Node.js server

   const {endpoints} = require('wildcard-api');

   endpoints.myFirstEndpoint = async function () {
     // The `this` object is the `requestProps` object we passed to `getApiResponse`.
     console.log('The HTTP request headers:', this.headers);

     return {msg: 'hello from my first Wildcard endpoint';
   };
   ~~~

3.  Use the `wildcard-api/client` package to remotely call the enpdoint `enpdoint.myFirstEndpoint` from the browser:

   ~~~js
   // Browser

   import {endpoints} from 'wildcard-api/client'; // npm install wildcard-api

   (async () => {
     const {msg} = await endpoints.myFirstEndpoint();
     console.log(msg);
   })();
   ~~~

That's it.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Authentication

Authentication usually uses HTTP headers
such as `Authorization: Bearer AbCdEf123456` or a cookie holding the user's session ID.

You can access the HTTP request headers in your endpoint functions by passing the `headers` object to `getApiResponse`:

~~~js
// Node.js server

app.all('/wildcard/*' , async (req, res) => {
  const requestProps = {
    url: req.url,
    method: req.method,
    body: req.body,
    // We pass the `headers` object
    headers: req.headers,
  };
  const responseProps = await getApiResponse(requestProps);
  res.status(responseProps.statusCode);
  res.type(responseProps.contentType);
  res.send(responseProps.body);
});
~~~

Wildcard makes `requestProps` available to your endpoint function as `this`:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');
const getUser = require('./path/to/your/auth-code/getUser');

endpoints.getLoggedInUser = async function() {
  // Since `this===requestProps`, `requestProps.headers` is available as `this.headers`.
  const user = await getUser(this.headers.cookie);
  return user;
};
~~~

If you do SSR,
an additional step needs to be done in order to make authentication work,
see [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication).

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Permissions

It is crucial that you define permissions.
You shouldn't do this:

~~~js
endpoints.run = async function(query) {
  const result = await db.run(query);
  return result;
};
~~~

That's a bad idea since anyone in the world can go on your website and call:

~~~js
const users = await endpoints.run('SELECT login, password FROM users;');
users.forEach(({login, password}) => {
  // W00t — I have all passwords ｡^‿^｡
  console.log(login, password);
});
~~~

Instead, you should define permissions:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const db = require('./path/to/your/db/code');

// The following endpoint showcases how to implement permissions with Wildcard.
// The endpoint only allows the author of a todo-item to modify it.

endpoints.updateTodoText = async function(todoId, newText) {
  const user = getLoggedUser(this.headers);
  if( !user ){
    // The user is not logged-in.
    // We abort.
    return;
  }

  const todo = await db.getTodo(todoId);

  if( !todo ){
    // `todoId` didn't match any todo.
    // We abort.
    return;
  }

  if( todo.authorId !== user.id ){
    // The user is not the author of the to-do item.
    // We abort.
    return;
  }

  // The user is logged-in and is the author of the todo.
  // We proceed: we commit the new to-do text.
  await db.updateTodoText(todoId, newText);
};
~~~

You may wonder why we return `undefined` when aborting:

~~~js
  // If the user is not logged-in, we abort.
  if( !user ){
    // Why do we return `undefined`?
    // Why don't we return something like `return {error: 'Permission denied'}`?
    return;
  }
~~~

The reason is simple:
when we develop the frontend we know what is allowed and the frontend always calls endpoints in an authorized way.
If an endpoint call isn't allowed, either there is a bug in our frontend or an attacker is trying to hack our backend.
If someone is trying to hack us, we want to provide him with the least amount of information and we just return `undefined`.

That said,
there are situations where it is expected that a permission may fail.
We may want to return a value then:

~~~js
endpoints.getTodoList = async function() {
  const user = getLoggedUser(this.headers)
  if( !user ) {
    // The frontend redirects to the login page.
    // Instead of returning `undefined` we return `isNotLoggedIn: true` so that
    // the frontend knows that the user should be redirected to the login page.
    return {
      isNotLoggedIn: true,
    };
  }
  /* ... */
}
~~~

Note that, in general, you shouldn't purposely throw exceptions:

~~~js
// Don't do this:
// (Because Wildcard treats exceptions as bugs, see the "Error Handling" section.)
endpoints.updateTodoText = async function(todoId, newText) {
  /*...*/
  if (todo.authorId !== user.id ){
    throw new Error('Permissen denied: user '+user.authorId+' is not the author of todo item '+todoId);
  }
  /*...*/
};
~~~

Return a JavaScript value instead:

~~~js
// We return a JavaScript value instead of throwing an exception.
endpoints.updateTodoText = async function(todoId, newText) {
  /*...*/
  if (todo.authorId !== user.id ){
    return {
      notAllowed: true,
      reason: user '+user.authorId+' is not the author of todo item '+todoId,
    };
  }
  /*...*/
};
~~~

Your endpoint functions shouldn't deliberately throw exceptions,
see [Error Handling](#error-handling).

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Error Handling

Calling an endpoint throws an error when:
- The browser cannot connect to the server. (The user is offline or your server is down.)
- The endpoint function throws an uncaught error.

If you use a library that is expected to throws errors, then catch them:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');
const validatePhoneNumber = require('some-phone-number-validatation-library');

endpoints.createAccount = async function({email, phoneNumber}) {
  // `validatePhoneNumber` throws an error if `phoneNumber` is not a phone number.
  let err;
  try {
    validatePhoneNumber(phoneNumber);
  } catch(err_) {
    err = err_
  }
  if( err ) {
    return {validationError: {phoneNumber: "Please enter a valid phone number."}};
  }

  /* ... */
};
~~~

You should always catch expected errors: Wildcard treats any uncaught error as a bug in your code.

In particular, don't throw an error upon validation failure:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');
const isStrongPassword = require('./path/to/isStrongPassword');

endpoints.createAccount = async function({email, password}) {
  /* Don't do this:
  if( !isStrongPassword(password) ){
    throw new Error("Password is too weak.");
  }
  */

  // Instead, return a JavaScript value, e.g. a JavaScript object:
  if( !isStrongPassword(password) ){
    return {validationError: "Password is too weak."};
  }

  /* ... */
};
~~~

You can use `isServerError` and `isNetworkError` to handle errors more precisely:

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
    // Your endpoint function throwed an uncaught error: there is a bug in your server code.
    alert(
      'Something went wrong on our side. We have been notified and we are working on a fix.' +
      'Sorry... Please try again later.'
    );
  }
  if( err.isNetworkError ){
    // The browser couldn't connect to the server.
    // The user is offline or your server is down.
    alert("We couldn't perform your request. Please try again.");
  }

  if( err ) {
    return {success: false};
  } else {
    return {success: true, data};
  }
}
~~~

You can also use [Handli](https://github.com/brillout/handli) which will automatically handle errors for you:

~~~js
// Browser

import 'handli'; // npm install handli
// That's it: Wildcard will automatically use Handli.
// Errors are now handled by Handli.
~~~

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## SSR

The Wildcard client is isomorphic (aka universal) and works in the browser as well as in Node.js.

If you don't need authentication, then SSR works out of the box.

Otherwise read [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication).

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Options

> :information_source:
> If you need an option that Wildcard is missing, then
> [open a ticket](https://github.com/reframejs/wildcard-api/issues/new).
> We usually implement new options within 1-2 days.

List of options:

~~~js
import wildcardClient from 'wildcard-api/client';

// The URL of the Node.js server that serves the API
wildcardClient.serverUrl = 'https://api.example.org';

// Whether the endpoint arguments are always passed in the HTTP body
wildcardClient.argumentsAlwaysInHttpBody = true;
~~~

More details about each option:

- [`serverUrl`](#serverurl)
- [`argumentsAlwaysInHttpBody`](#argumentsalwaysinhttpbody)

<br/>

### `serverUrl`

You usually don't need to provide any `serverUrl`.
But if your API and your browser-side assets are not served by the same server,
then you need to provide a `serverUrl`.

`serverUrl` can be one of the following:
- `null`
- The URL of the server, for example `http://localhost:3333/api` or `https://api.example.org`.
- The IP address of the server, for example `92.194.249.32`.

For example:

~~~js
import wildcardClient, {endpoints} from 'wildcard-api/client';
import assert from 'assert';

wildcardClient.serverUrl = 'https://api.example.com:1337'; // Default value is `null`

callEndpoint();

async function callEndpoint() {
  await endpoints.myEndpoint();

  assert(window.location.origin==='https://example.com');
  // Normally, Wildcard would make the HTTP request to the same origin:
  //   POST https://example.com/wildcard/myEndpoint HTTP/1.1

  // But because we have set `serverUrl`, Wildcard makes
  // the HTTP request to `https://api.example.com:1337`:
  //   POST https://api.example.com:1337/wildcard/myEndpoint HTTP/1.1
};
~~~

<br/>

### `argumentsAlwaysInHttpBody`

This is about configuring whether
arguments are always passed in the HTTP request body.
(Instead of being passed in the HTTP request URL.)

For example:

~~~js
import wildcardClient, {endpoints} from 'wildcard-api/client';

wildcardClient.argumentsAlwaysInHttpBody = true; // Default value is `false`

callEndpoint();

async function callEndpoint() {
  await endpoints.myEndpoint({some: 'arguments' }, 'second arg');

  // Normally, Wildcard would pass the arguments in the HTTP request URL:
  //   POST /wildcard/myEndpoint/[{"some":"arguments"},"second arg"] HTTP/1.1

  // But because we have set `argumentsAlwaysInHttpBody` to `true`,
  // Wildcard passes the arguments in the HTTP request body:
  //   POST /wildcard/myEndpoint HTTP/1.1
  //   Request payload: [{"some":"arguments"},"second arg"]
};
~~~

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Learning Material

Material to learn more about RPC and Wildcard. Create a Pull Request to add yours.

- [What is RPC](/docs/what-is-rpc.md#what-is-rpc)
  <br/>
  Explains what RPC is.
- [How Wildcard Works](/docs/how-wildcard-works.md#how-wildcard-works)
  <br/>
  Talks about the technologies Wildcard uses under the hood.
- [FAQ](/docs/faq.md#faq)
  <br/>
  Covers high-level questions such as "Which is more powerful, GraphQL or RPC?"
  as well as low-level questions such as
  "How can I do versioning with RPC?" or
  "Doesn't RPC tightly couple frontend with backend?".
- [RPC vs REST/GraphQL](/docs/rpc-vs-rest-graphql.md#rpc-vs-restgraphql)
  <br/>
  Compares RPC with REST/GraphQL, in depth.
- [Example - A Todo List](/example#example---a-todo-list)
  <br/>
  Showcases a to-do list app built with RPC/Wildcard.
- [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication)
  <br/>
  How to use Wildcard with SSR and Authentication.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



