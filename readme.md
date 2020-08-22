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
    <img src="/docs/images/logo-title.svg" height="105" alt="Wildcard API"/>
  </a>
</p>

<p align="center">
  <sup>
    <a href="#top">
      <img src="/docs/images/blank.svg" height="10px" align="middle" width="23px"/>
      <img
        src="/docs/images/star.svg"
        width="13"
        align="middle"
      />
      Star if you like
    </a>
    &nbsp;&nbsp;&nbsp;&nbsp;
    &nbsp;&nbsp;&nbsp;&nbsp;
    &nbsp;&nbsp;
    <a href="https://twitter.com/intent/tweet?text=Interesting%20alternative%20to%20REST%20and%20GraphQL.%0Ahttps%3A%2F%2Fgithub.com%2Freframejs%2Fwildcard-api" target="_blank">
      <img
        src="/docs/images/twitter.svg"
        width="15"
        align="middle"
      />
      Tweet about Wildcard
    </a>
  </sup>
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
<br/>
<sub>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
Basics
</sub>
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Authentication](#authentication)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Permissions](#permissions)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Error Handling](#error-handling)
<br/>
<sub>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
More
</sub>
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[TypeScript](#typescript)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Dev Tools](#dev-tools)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[API Documentation](#api-documentation)
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

To retrieve and mutate data, you can directly use SQL or an ORM.

~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');
const Todo = require('./path/to/your/data/models/Todo');

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

&nbsp;

<p align="center">
  :sparkles:
  <b>Easy Setup</b>
  <img src="/docs/images/blank.svg" height="1" width="85" align="middle"/>
  :shield:
  <b>Simple Permissions</b>
  <img src="/docs/images/blank.svg" height="1" width="42" align="middle"/>
  :rotating_light:
  <b>Simple Error Handling</b>
  <img src="/docs/images/blank.svg" height="1" width="1" align="middle"/>
  <br/>
  :detective:
  <b>Dev Tools</b>
  <img src="/docs/images/blank.svg" height="1" width="96" align="middle"/>
  :microscope:
  <b>TypeScript Support</b>
  <img src="/docs/images/blank.svg" height="1" width="47" align="middle"/>
  :memo:
  <b>SSR Support</b>
  <img src="/docs/images/blank.svg" height="1" width="71" align="middle"/>
  <br/>
  :zap:
  <b>Automatic Caching</b>
  <img src="/docs/images/blank.svg" height="1" width="455" align="middle"/>
</p>

&nbsp;

> The seamless "drop in and use" nature of Wildcard has enabled Vibescout to accelerate the development of new features, it enables us to quickly prototype new ideas and build out internal dashboards with ease (without the unneeded verbosity of things like GraphQL). The barrier between our server and client is almost nonexistent now- it's really just a function!
<p align="right">
Paul Myburgh, CTO of Vibescout <a href="https://github.com/reframejs/wildcard-api/issues/22#issuecomment-566983911">(ref)</a>
</p>

&nbsp;

> We are a web shop and decided to try Wildcard with one of our projects. We were delighted: not only made Wildcard our front-end development simpler and faster but it also allowed us to easily implement features that were previously difficult to implement with the rigid structure of REST and GraphQL. We now use it for all our new Node.js projects and we couldn't be happier. The cherry on the cake: it now supports TypeScript which, for us, makes Wildcard a no-brainer.
<p align="right">
Niels Litt <a href="https://github.com/reframejs/wildcard-api/issues/22#issuecomment-568246660">(ref)</a>
</p>

&nbsp;

## Wildcard compared to REST and GraphQL

REST and GraphQL are well-suited tools to create an API that is meant to be used by third-party developers.
Facebook's API, for example, is used by ~200k third parties.
It is no surprise that Facebook is using (and invented) GraphQL;
it enables third-party developers
to extensively access Facebook's social graph
allowing them to build all kinds of applications.
For an API used by many third parties with many diverse uses cases, GraphQL is the right tool.

However,
if you want to create a backend API that is meant to be used only by your frontend,
then you don't need REST nor GraphQL &mdash; [RPC](/docs/what-is-rpc.md#what-is-rpc), such as Wildcard, is enough.

For a large app, you may still want the structure that comes with a RESTful/GraphQL API.
But this typically applies only for large companies that develop apps with a high number of developers, and "premature optimization is the root of all evil";
start with
[RPC as default](/docs/blog/rpc-as-default.md#rpc-as-default)
and later switch to [REST or GraphQL](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer)
when and only if the need arises.

In a nuthsell:
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
Is your API meant to be used by third parties? Use REST or GraphQL.
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
Is your API meant to be used by yourself? Use RPC.

&nbsp;

## Getting Started

1. Install Wildcard.

   With Express:
   ~~~js
   const express = require('express');
   const wildcard = require('@wildcard-api/server/express'); // npm install @wildcard-api/server

   const app = express();

   // We install the Wildcard middleware
   app.use(wildcard(getContext));

   // `getContext` is called on every API request. It defines the `context` object.
   // `req` is Express' request object
   async function getContext(req) {
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
   const Hapi = require('hapi');
   const wildcard = require('@wildcard-api/server/hapi'); // npm install @wildcard-api/server

   const server = Hapi.Server();

   // We install the Wildcard middleware
   await server.register(wildcard(getContext));

   // `getContext` is called on every API request. It defines the `context` object.
   // `request` is Hapi's request object
   async function getContext(request) {
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
   const Koa = require('koa');
   const wildcard = require('@wildcard-api/server/koa'); // npm install @wildcard-api/server

   const app = new Koa();

   // We install the Wildcard middleware
   app.use(wildcard(getContext));

   // `getContext` is called on every API request. It defines the `context` object.
   async function getContext(ctx) {
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
   You use `getApiHttpResponse` to build the HTTP response for any HTTP request made to `/_wildcard_api/*`.
   ~~~js
   // This is generic pseudo code for how to integrate Wildcard with any server framework.

   const {getApiHttpResponse} = require('@wildcard-api/server'); // npm install @wildcard-api/server

   // A server framework usually provides a way to add a route and define an HTTP response.
   const {addRoute, HttpResponse} = require('your-favorite-server-framework');

   // Add a new route `/_wildcard_api/*` to your server
   addRoute(
     '/_wildcard_api/*',
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
     // The `this` object is the `context` object we defined in `getContext`.
     console.log('The logged-in user is: ', this.user.username);

     return {msg: 'Hello, from my first Wildcard endpoint'};
   };
   ~~~

   > :information_source:
   > Wildcard automatically loads any file named `endpoints.js` or `*.endpoints.js`.

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
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Authentication

Use the context object to authenticate requests. For example:

~~~js
// Node.js server

const express = require('express');
const wildcard = require('@wildcard-api/server/express');

const app = express();

// We install the Wildcard middleware
app.use(wildcard(getContext));

// We define the context object
async function getContext(req) {
  // `req` is Express' request object

  const context = {};

  // Express authentication middlewares usually make information
  // about the logged-in user available at `req.user`.
  context.user = req.user;

  // We add authentication operations to the context object
  // in order to make them available to our endpoint functions.
  context.login = req.auth.login;
  context.logout = req.auth.logout;

  return context;
}
~~~

The context object is available to endpoint functions as `this`.

~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');

endpoints.whoAmI = async function() {
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
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
  // Only admins are allowed to remove a post
  if( !user.isAdmin ) return;

  // ...
};
~~~

It is crucial that you define permissions.
You should never do this:
~~~js
// Node.js server

const db = require('your-favorite-sql-query-builder');

endpoints.executeQuery = async function(query) {
  const result = await db.run(query);
  return result;
};
~~~

That's a bad idea since anyone in the world can go to your website,
open the browser's web dev console, and call your endpoint.
~~~js
// Browser

const users = await endpoints.executeQuery('SELECT login, password FROM users;');
users.forEach(({login, password}) => {
  // W00t I have all passwords ｡^‿^｡
  console.log(login, password);
});
~~~

Instead, you should define permissions. For example:
~~~js
// Node.js server

// This endpoint allows a to-do item's text to be modified only by its author.

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

if( !this.user ){
  // Why do we return `undefined`?
  // Why don't we return something like `return {error: 'Permission denied'};`?
  return;
}
~~~

The reason is simple:
when we develop the frontend we know what is allowed and we can
develop the frontend to always call endpoints in an authorized way.
If an endpoint call isn't allowed, either there is a bug in our frontend code or an attacker is trying to hack our backend.
If someone is trying to hack us, we want to give him the least amount of information and we just return `undefined`.

That said,
there are situations where it is expected that a permission may fail, and
you may want to return the information that the permission failed. For example:
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
    throw new Error('User is not logged in.');
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
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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

You shouldn't deliberately throw exceptions:
Wildcard considers any uncaught error as a bug in your code.
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
    // Return a JavaScript value instead:
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
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## TypeScript

You can use your backend types on the frontend by using TypeScript's `typeof`.

~~~ts
// /examples/typescript/endpoints.ts

import wildcard from '@wildcard-api/server';

interface Person {
  firstName: string;
  lastName: string;
  id: number;
}

const persons : Array<Person> = [
  {firstName: 'John', lastName: 'Smith', id: 0},
  {firstName: 'Alice', lastName: 'Graham', id: 1},
  {firstName: 'Harry', lastName: 'Thompson', id: 2},
];

async function getPerson(id: number): Promise<Person> {
  return persons.find(person => person.id===id);
};

const endpoints = {
  getPerson,
};
export type Endpoints = typeof endpoints;

Object.assign(wildcard.endpoints, endpoints);
~~~
~~~ts
// /examples/typescript/client/index.ts

import "babel-polyfill";
import { Endpoints } from "../endpoints";
import { endpoints as endpointsUntyped } from "@wildcard-api/client";

export const endpoints: Endpoints = endpointsUntyped;

(async () => {
  const id = Math.floor(Math.random()*3);
  const person = await endpoints.getPerson(id);
  const personHtml = person.firstName + ' ' + person.lastName + ' <b>(' + person.id + ')</b>';
  document.body.innerHTML = personHtml;
})();
~~~

<p align="center">
  <a href="#typescript">
    <img src="/examples/typescript/screenshots/types-on-frontend-1.png" width="850" height="195" align="middle" />
    <br/>
    <br/>
    <img src="/examples/typescript/screenshots/types-on-frontend-2.png" width="850" height="212" align="middle" />
  </a>
</p>

TypeScript usage examples:
- [/examples/typescript/](/examples/typescript/)
- [/examples/prisma/](/examples/prisma/)


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



## Dev Tools

Wildcard is in *dev mode* when `[undefined, 'development'].includes(process.env.NODE_ENV)`.

In dev mode you can:
- List all API endpoints.
- Call endpoints directly in the browser.

<p align="left">
  <a href="#dev-tools">
    <img src="/docs/images/dev-mode_list-of-endpoints.png" width="301" height="187" align="left"/>
    <img src="/docs/images/dev-mode_endpoint.png" width="515" height="290"/>
  </a>
</p>


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



## API Documentation

You can browse your API by using [Wildcard's dev tools](#dev-tools).

More evolved API browsing tools such as OpenAPI (formerly known as Swagger) makes sense for an API that is meant to be used by third-party developers who don't have access to your source code.

A Wildcard API is meant to be used by your own developers;
instead of using OpenAPI,
you can give your frontend developers access to your backend code and save all endpoints in files named `endpoints.js`.
That way, a frontend developer can explore your API.

For improved developer experience,
you can use [Wildcard with TypeScript](#typescript) to make type hints available on the frontend.
A frontend developer can then explore your Wildcard API directly in his IDE!


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



## Caching

Wildcard automatically caches your endpoint results by using the HTTP ETag header.
You can disable caching by using the [`disableEtag` option](#disableetag).


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



## SSR

The Wildcard client is isomorphic (aka universal) and works in the browser as well as in Node.js.

If you don't need authentication, then SSR works out of the box.
If you do, then read [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication).


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



## Options

Quick overview of all available options with their default value:
~~~js
import wildcardClient from '@wildcard-api/client';

// The URL of the Node.js server that serves the API
wildcardClient.serverUrl = null;

// The base URL of Wildcard HTTP requests
wildcardClient.baseUrl = '/_wildcard_api/';

// Whether the endpoint arguments are always passed in the HTTP body
wildcardClient.argumentsAlwaysInHttpBody = false;
~~~
~~~js
import wildcardServer from '@wildcard-api/server';

// Whether Wildcard generates an ETag header.
wildcardServer.disableEtag = false;

// The base URL of Wildcard HTTP requests
wildcardServer.baseUrl = '/_wildcard_api/';
~~~

- [`serverUrl`](#serverurl)
- [`baseUrl`](#baseUrl)
- [`argumentsAlwaysInHttpBody`](#argumentsalwaysinhttpbody)
- [`disableEtag`](#disableetag)

<br/>

### `serverUrl`

You usually don't need to provide any `serverUrl`.
But if your API and your browser-side assets are not served by the same server,
then you need to provide a `serverUrl`.

`serverUrl` can be one of the following:
- `null`. (Default value.)
- The URL of the server, for example `http://localhost:3333/api` or `https://api.example.org`.
- The IP address of the server, for example `92.194.249.32`.

When `serverUrl` is `null`, the Wildcard client uses `window.location.origin` as server URL.

~~~js
import wildcardClient, {endpoints} from '@wildcard-api/client';
import assert from 'assert';

wildcardClient.serverUrl = 'https://api.example.com:1337';

callEndpoint();

async function callEndpoint() {
  await endpoints.myEndpoint();

  assert(window.location.origin==='https://example.com');
  // Normally, Wildcard would make an HTTP request to the same origin:
  //   POST https://example.com/_wildcard_api/myEndpoint HTTP/1.1

  // But because we have set `serverUrl`, Wildcard makes
  // the HTTP request to `https://api.example.com:1337` instead:
  //   POST https://api.example.com:1337/_wildcard_api/myEndpoint HTTP/1.1
};
~~~

<br/>

### `baseUrl`

By default, the pathname of any HTTP request that Wildcard makes starts with `/_willdcard_api/`.
You can change this base URL by using the `baseUrl` option.

~~~js
import wildcardClient, {endpoints} from '@wildcard-api/client';
import assert from 'assert';

wildcardClient.baseUrl = '/_my_custom_api_base_url/';

callEndpoint();

async function callEndpoint() {
  await endpoints.myEndpoint();

  assert(window.location.origin==='https://example.com');
  // Normally, Wildcard would make an HTTP request to `/_wildcard_api/`:
  //   POST https://example.com/_wildcard_api/myEndpoint HTTP/1.1

  // But because we have changed `baseUrl`, Wildcard makes
  // the HTTP request to `/_my_custom_api_base_url/` instead:
  //   POST https://example.com/_my_custom_api_base_url/myEndpoint HTTP/1.1
};
~~~

If you change the `baseUrl` option of your Wildcard client,
then make sure that the `baseUrl` of your Wildcard server is the same:

~~~js
import wildcardServer from '@wildcard-api/server';

wildcardServer.baseUrl = '/_my_custom_api_base_url/';
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
  //   POST /_wildcard_api/myEndpoint/[{"some":"arguments"},"second arg"] HTTP/1.1

  // But because we have set `argumentsAlwaysInHttpBody` to `true`,
  // Wildcard passes the arguments in the HTTP request body instead:
  //   POST /_wildcard_api/myEndpoint HTTP/1.1
  //   Request payload: [{"some":"arguments"},"second arg"]
};
~~~

<br/>

### `disableEtag`

By default Wildcard generates an HTTP ETag cache header.
If you need to save CPU computation time,
you can set `disableEtag` to `true` and Wildcard will skip generating HTTP ETag headers.

~~~js
import wildcardServer from '@wildcard-api/server';

wildcardServer.disableEtag = true;
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



## Learning Material

Material to learn more about RPC and Wildcard.

###### RPC

- [What is RPC](/docs/what-is-rpc.md#what-is-rpc)
  <br/>
  Explains what RPC is.
- [FAQ](/docs/faq.md#faq)
  <br/>
  FAQ about RPC.
  Covers high-level questions such as "Which is more powerful, GraphQL or RPC?"
  as well as low-level questions such as
  "How can I do versioning with RPC?" or
  "Doesn't RPC tightly couple frontend with backend?".
- [What is the difference between REST and RPC?](/docs/blog/rest-rpc.md#readme)
  <br/>
  This post explains what REST, RPC, and RPC-like means.

###### Blog

- [RPC as Default](/docs/blog/rpc-as-default.md#rpc-as-default)
- [REST or GraphQL? A simple answer.](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer)

###### Wildcard

- [How Wildcard Works](/docs/how-wildcard-works.md#how-wildcard-works)
  <br/>
  Talks about the technologies Wildcard uses under the hood.
- [Example - A Todo List](/examples/todo-list/#example---a-todo-list)
  <br/>
  Showcases a to-do list app built with RPC/Wildcard.
- [SSR & Authentication](/docs/ssr-auth.md#ssr--authentication)
  <br/>
  How to use Wildcard with SSR and Authentication.


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
