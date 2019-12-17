<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/reframejs/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=106 alt="Wildcard API"/>
  </a>
</p>

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
[Dev Tools](#dev-tools)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Caching](#caching)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[SSR](#ssr)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Options](#options)

<br/>

## What is Wildcard

Wildcard is a JavaScript library to create an API between your Node.js backend and your browser frontend.

With Wildcard,
creating an API endpoint is as easy as creating a JavaScript function.

~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');

// We define a `hello` function on the server
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from '@wildcard-api/client';

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
You can, for example, use SQL or ORM queries.

~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  if( !this.user ) {
    // The user is not logged-in. We abort.
    // With Wildcard, you define permissions programmatically
    // which we talk more about in the "Permissions" section.
    return;
  }

  // With an ORM:
  const newTodo = new Todo({text, authorId: this.user.id});
  await newTodo.save();

  /* With SQL:
  const db = require('your-favorite-sql-query-builder');
  const [newTodo] = await db.query(
    "INSERT INTO todos VALUES (:text, :authorId);",
    {text, authorId: this.user.id}
  );
  */

  return newTodo;
};
~~~

Wildcard is used in production at several projects,
every release is assailed against a heavy suit of automated tests,
and issues are fixed promptly.

<p align="center">
  :sparkles:
  <b>Easy Setup</b>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  :shield:
  <b>Simple Permissions</b>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  :boom:
  <b>Simple Error Handling</b>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <br/>
  :eyes:
  <b>Dev Tools</b>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;
  :memo:
  <b>SSR Support</b>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  :wrench:
  <b>Server Framework Agnostic</b>
  <br/>
  :zap:
  <b>Automatic Caching</b>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</p>

&nbsp;

## Wildcard compared to REST and GraphQL

REST and GraphQL are well-suited tools to create an API that is meant to be used by a large number of developers.
Facebook's API, for example, is used by ~200k third parties.
It is no surprise that Facebook is using (and invented) GraphQL;
a GraphQL API enables
third-party developers
to extensively access Facebook's social graph
and build all kinds of applications.
For such API used by so many diverse and numerous third parties,
GraphQL is the right tool.

But,
for small to medium-sized projects,
[RPC](/docs/what-is-rpc.md#what-is-rpc)
such as Wildcard is often enough.
RPC is especially well suited for prototypes
which usually need only few API endpoints &mdash;
RPC allows you to quickly deliver, modify, and evolve an MVP.

Deciding whether to use REST or GraphQL for an application that does not yet exist
[is difficult](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer).
RPC allows you to implement a prototype without REST nor GraphQL at first and later decide,
as you scale and as it becomes clear what you need,
whether RPC is enough and,
if RPC is not enough,
whether either REST or GraphQL best fits your application.
You can then progressively replace your RPC endpoints with your newly created RESTful or GraphQL API.

In short,
use [RPC as Default](/docs/blog/rpc-as-default.md#rpc-as-default) and
switch to REST or GraphQL when and if the need arises.

&nbsp;

## Getting Started

1. Install Wildcard.

   With Express:
   ~~~js
   // Node.js server

   const express = require('express');
   const wildcard = require('@wildcard-api/server/express'); // npm install @wildcard-api/server

   const app = express();

   // We install the Wildcard middleware
   app.use(wildcard(getContext));

   // `getContext` is called on every API request and allows you to define the `context` object.
   // `req` is Express' object that holds information about the HTTP request.
   async function getContext(req) {
     // The `context` object is available to your endpoint functions as `this`.
     const context = {};
     // Authentication middlewares usually make user information available at `req.user`.
     context.user = req.user;
     return context;
   }
   ~~~

   <details>
   <summary>
   With Hapi
   </summary>

   ~~~js
   // Node.js server

   const Hapi = require('hapi');
   const wildcard = require('@wildcard-api/server/hapi'); // npm install @wildcard-api/server

   const server = Hapi.Server();

   // We install the Wildcard middleware
   await server.register(wildcard(getContext));

   // `getContext` is called on every API request and allows you to define the `context` object.
   // `request` is Hapi's object that holds information about the HTTP request.
   async function getContext(request) {
     // The `context` object is available to your endpoint functions as `this`.
     const context = {};
     // Authentication plugins usually make user information available at `request.auth.credentials`.
     context.user = request.auth.isAuthenticated ? request.auth.credentials : null;
     return context;
   }
   ~~~
   </details>

   <details>
   <summary>
   With Koa
   </summary>

   ~~~js
   // Node.js server

   const Koa = require('koa');
   const wildcard = require('@wildcard-api/server/koa'); // npm install @wildcard-api/server

   const app = new Koa();

   // We install the Wildcard middleware
   app.use(wildcard(getContext));

   // `getContext` is called on every API request and allows you to define the `context` object.
   // `ctx` is Koa's object that holds information about the HTTP request.
   async function getContext(ctx) {
     // The `context` object is available to your endpoint functions as `this`.
     const context = {};
     // Authentication middlewares often make user information available at `ctx.state.user`.
     context.user = ctx.state.user;
     return context;
   }
   ~~~
   </details>

   <details>
   <summary>
   With other server frameworks
   </summary>

   The function `getApiHttpResponse` allows you to use Wildcard with any
   server framework.
   In fact, the Express/Koa/Hapi middlewares are tiny wrappers around `getApiHttpResponse`.
   You use `getApiHttpResponse` to build the HTTP response for any HTTP request made to `/wildcard/*`.
   ~~~js
   // Node.js server

   // This is generic pseudo code for how to integrate Wildcard with any server framework.

   const {getApiHttpResponse} = require('@wildcard-api/server'); // npm install @wildcard-api/server

   // A server framework usually provides a way to add a route and define an HTTP response.
   const {addRoute, HttpResponse} = require('your-favorite-server-framework');

   // Add a new route `/wildcard/*` to your server
   addRoute(
     '/wildcard/*',
     // A server framework usually provides an object holding
     // information about the request. We denote this object `req`.
     async ({req}) => {
       // The context object is available to endpoint functions as `this`.
       const context = {
         user: req.user, // Information about the logged-in user.
       };

       const {
         url, // The HTTP request url (or pathname)
         method, // The HTTP request method (`GET`, `POST`, etc.)
         body, // The HTTP request body
       } = req;

       const responseProps = await getApiHttpResponse({url, method, body}, context);

       const {body, statusCode, contentType} = responseProps;
       const response = new HttpResponse({body, statusCode, contentType});
       return response;
     }
   );
   ~~~
   </details>

2. Define an endpoint function `endpoints.myFirstEndpoint` in a file called `endpoints.js`.

   ~~~js
   // Node.js server

   const {endpoints} = require('@wildcard-api/server');

   endpoints.myFirstEndpoint = async function () {
     // The `this` object is the `context` object we defined when we installed the Wildcard middleware.
     console.log('The logged-in user name is: ', this.user.username);

     return {msg: 'Hello, from my first Wildcard endpoint';
   };
   ~~~

   > :information_source:
   > Wildcard automatically loads any file named `endpoints.*` or `*.endpoints.*`.

3. Use the `@wildcard-api/client` package to remotely call `enpdoint.myFirstEndpoint` from the browser.

   ~~~js
   // Browser

   import {endpoints} from '@wildcard-api/client'; // npm install @wildcard-api/client

   (async () => {
     const {msg} = await endpoints.myFirstEndpoint();
     console.log(msg);
   })();
   ~~~

That's it.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Authentication

You can use the `context` object to make authentication available to your endpoint functions.

~~~js
// Node.js server

// We define the `context` object while installing the Wildcard middleware.

app.use(wildcard(async req => {
  // The context object is available to endpoint functions as `this`.
  const context = {};

  // Authentication middlewares usually make information about the logged-in
  // user available on the request object, for example `req.user`.
  context.user = req.user;

  context.login = context.auth.login;
  context.logout = context.auth.logout;

  return context;
}));
~~~

The `context` object is available to your endpoint function as `this`.

~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');

endpoints.whoAmI = async function() {
  // `this===context`; `context.user` is available as `this.user`.
  const {user} = this;
  return user.name;
};

endpoints.login = async function(username, password) {
  const user = await this.login(username, password);
  return user;
};

endpoints.logout = async function() {
  await this.logout();
};
~~~

If you do SSR then read [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication).


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Permissions

With Wildcard,
permissions are defined programmatically.

~~~js
// Node.js server

endpoints.deletePost = async function(){
  // Only admins are allow to remove a post
  if( !user.isAdmin ) return;

  // ...
};
~~~

It is crucial that you define permissions.
You should never do this:
~~~js
// Node.js server

endpoints.run = async function(query) {
  const result = await db.run(query);
  return result;
};
~~~

That's a bad idea since anyone in the world can go to your website,
open the browser's web dev console, and call your endpoint.
~~~js
// Browser

const users = await endpoints.run('SELECT login, password FROM users;');
users.forEach(({login, password}) => {
  // W00t — I have all passwords ｡^‿^｡
  console.log(login, password);
});
~~~

Instead, you should define permissions, for example:
~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');
const db = require('./path/to/your/db/code');

// The following endpoint allows a to-do item's text to be modified only by its author.

endpoints.updateTodoText = async function(todoId, newText) {
  // The user is not logged in — we abort.
  if( !this.user ) return;

  const todo = await db.getTodo(todoId);
  // There is no to-do item in the database with the ID `todoId` — we abort.
  if( !todo ) return;

  // The user is not the author of the to-do item — we abort.
  if( todo.authorId !== this.user.id ) return;

  // The user is logged-in and is the author of the todo — we proceed.
  await db.updateTodoText(todoId, newText);
};
~~~

You may wonder why we return `undefined` when aborting.

~~~js
// Node.js server

// The user is not logged-in — we abort.
if( !this.user ){
  // Why do we return `undefined`?
  // Why don't we return something like `return {error: 'Permission denied'}`?
  return;
}
~~~

The reason is simple:
when we develop the frontend we know what is allowed and we can
develop the frontend to always call endpoints in an authorized way.
If an endpoint call isn't allowed, either there is a bug in our frontend or an attacker is trying to hack our backend.
If someone is trying to hack us, we want to give him the least amount of information and we just return `undefined`.

That said,
there are situations where it is expected that a permission may fail and
you may want to return the information that the permission failed, for example:
~~~js
// When the user is not logged in, the frontend redirects the user to the login page.

endpoints.getTodoList = async function() {
  if( !this.user ) {
    // Instead of returning `undefined` we return `{isNotLoggedIn: true}` so that
    // the frontend knows that the user should be redirected to the login page.
    return {isNotLoggedIn: true};
  }
  // ...
};
~~~

Note that you should not deliberately throw exceptions.
~~~js
endpoints.getTodoList = async function() {
  if( !this.user ) {
    // Don't do this:
    throw new Error('Permissen denied: user is not logged in.');
  }
  // ...
};
~~~

Return a JavaScript value instead.
~~~js
endpoints.getTodoList = async function() {
  if( !this.user ) {
    // Do this:
    return {isNotLoggedIn: true};
  }
  // ...
};
~~~

Your endpoint functions should not deliberately throw exceptions because
Wildcard treats exceptions as bugs,
which we explain in the next section [Error Handling](#error-handling).


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Error Handling

Calling an endpoint throws an error when:
- The browser couldn't connect to the server. (The user is offline or your server is down.)
- The endpoint function threw an error.

~~~js
// Browser

import {endpoints} from '@wildcard-api/client';
import assert from 'assert';

(async () => {
  let err;
  try {
    await endpoints.myEndpoint();
  } catch(_err) {
    err = _err;
  }

  assert(err || err.isNetworkError || err.isServerError);
  if( !err ){
    // Success: the browser could connect to the server and
    // the endpoint function `myEndpoint` didn't throw an error.
  }
  if( err.isNetworkError ){
    // Error: the browser couldn't connect to the server
    assert(err.message==='No Server Connection');
  }
  if( err.isServerError ){
    // Error: the endpoint function `myEndpoint` threw an error.
    assert(err.message==='Internal Server Error');
  }
})();
~~~

Wildcard considers an uncaught error as a bug in your code.

You shouldn't deliberately throw exceptions.
In particular, don't throw an error upon validation failure.
~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');
const isStrongPassword = require('./path/to/isStrongPassword');

endpoints.createAccount = async function({email, password}) {
  if( !isStrongPassword(password) ){
    /* Don't do this:
    throw new Error("Password is too weak.");
    */
    // Instead, return a JavaScript value:
    return {validationError: "Password is too weak."};
  }

  // ..
};
~~~

You can use `isServerError` and `isNetworkError` to handle errors more precisely.
~~~js
// Browser

import {endpoints} from '@wildcard-api/client';

(async () => {
  let data, err;
  try {
    data = await endpoints.getSomeData();
  } catch(_err) {
    err = _err;
  }

  if( err.isServerError ){
    // Your endpoint function threw an uncaught error: there is a bug in your server code.
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
})();
~~~

You can also use [Handli](https://github.com/brillout/handli) which will automatically and gracefully handle errors for you.

~~~js
// Browser

import 'handli'; // npm install handli
// That's it, Wildcard will automatically use Handli.
// Errors are now handled by Handli.
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Caching

Wildcard automatically caches your endpoint results by using the HTTP ETag header.
You can disable caching by using the [`disableEtag` option](#disableetag).


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Dev Tools

You can browse your API by going to `/wildcard/`.
For example, if your app is running at `http://localhost:3000` then go to `http://localhost:3000/wildcard/`.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## SSR

The Wildcard client is isomorphic (aka universal) and works in the browser as well as in Node.js.

If you don't need authentication, then SSR works out of the box.
If you do, then read [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication).


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Options

~~~js
import wildcardClient from '@wildcard-api/client';

// The URL of the Node.js server that serves the API
wildcardClient.serverUrl = 'https://api.example.org';

// Whether the endpoint arguments are always passed in the HTTP body
wildcardClient.argumentsAlwaysInHttpBody = false;
~~~
~~~js
import wildcardServer from '@wildcard-api/server';

// Whether Wildcard generates an ETag header.
wildcardServer.disableEtag = false;
~~~

- [`serverUrl`](#serverurl)
- [`argumentsAlwaysInHttpBody`](#argumentsalwaysinhttpbody)
- [`disableEtag`](#disableetag)

<br/>

### `serverUrl`

You usually don't need to provide any `serverUrl`.
But if your API and your browser-side assets are not served by the same server,
then you need to provide a `serverUrl`.

`serverUrl` can be one of the following:
- `null`
- The URL of the server, for example `http://localhost:3333/api` or `https://api.example.org`.
- The IP address of the server, for example `92.194.249.32`.

~~~js
import wildcardClient, {endpoints} from '@wildcard-api/client';
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

The `argumentsAlwaysInHttpBody` option is about configuring whether
arguments are always passed in the HTTP request body.
(Instead of being passed in the HTTP request URL.)

~~~js
import wildcardClient, {endpoints} from '@wildcard-api/client';

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

<br/>

### `disableEtag`

The `disableEtag` option is about configuring whether Wildcard generates an HTTP ETag header.

~~~js
import wildcardServer from '@wildcard-api/server';

wildcardServer.disableEtag = false;
~~~



<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Learning Material

Material to learn more about RPC and Wildcard. Create a Pull Request to add yours.

###### Blog

- [RPC as Default](/docs/blog/rpc-as-default.md#rpc-as-default)
- [REST or GraphQL? A simple answer.](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer)
- [What do REST and RPC-like mean?](/docs/blog/rest-rpc.md#readme)

###### RPC

- [What is RPC](/docs/what-is-rpc.md#what-is-rpc)
  <br/>
  Explains what RPC is.
- [RPC FAQ](/docs/faq.md#faq)
  <br/>
  FAQ about RPC.
  Covers high-level questions such as "Which is more powerful, GraphQL or RPC?"
  as well as low-level questions such as
  "How can I do versioning with RPC?" or
  "Doesn't RPC tightly couple frontend with backend?".
- [RPC vs REST/GraphQL](/docs/rpc-vs-rest-graphql.md#rpc-vs-restgraphql)
  <br/>
  Compares RPC with REST/GraphQL, in depth.

###### Wildcard

- [How Wildcard Works](/docs/how-wildcard-works.md#how-wildcard-works)
  <br/>
  Talks about the technologies Wildcard uses under the hood.
- [Example - A Todo List](/example#example---a-todo-list)
  <br/>
  Showcases a to-do list app built with RPC/Wildcard.
- [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication)
  <br/>
  How to use Wildcard with SSR and Authentication.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
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
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/readme.template.md` and run `npm run docs` (or `yarn docs`).






-->
