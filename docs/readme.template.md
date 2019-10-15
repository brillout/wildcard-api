!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path

<br/>

- [What is Wildcard](#what-is-wildcard)
- [Wildcard compared to REST, GraphQL, and other RPCs](#wildcard-compared-to-REST-GraphQL-and-other-RPCs)
- Usage
  - [Getting Started](#getting-started)
  - [Authentication](#authentication)
  - [Permissions](#permissions)
  - [Error Handling](#error-handling)
  - [SSR](#ssr)
  - [Options](#options)
- [More Resources](#more-resources)

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
  const {message} = await endpoints.hello('Alice');
  console.log(message); // Prints `Welcome Alice`
})();
~~~

That's all Wildcard does:
it makes functions,
that are defined on your Node.js server,
"callable" in the browser.
Nothing more, nothing less.

How you retrieve/mutate data is up to you;
you can use any SQL/NoSQL/ORM query:

~~~js
// Node.js

const endpoints = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  const user = await getLoggedUser(this.headers); // We talk about `this` later.

  if( !user ) {
    // The user is not logged-in.
    // We abort.
    // (This is basically how you define permissions with Wildcard
    // which we will talk more about later.)
    return;
  }

  // With an ORM/ODM:
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

Wildcard is new but already used in production at couple of projects,
every release is assailed against a heavy suit of automated tests,
its author is responsive, and issues are fixed within 1-2 days.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Wildcard compared to REST, GraphQL, and other RPCs

Wildcard is an [RPC](/docs/rpc.md#what-is-rpc) tool.

While REST and GraphQL shine for APIs that are meant to consumed by third parties,
RPC is increasingly used for internal APIs, prototypes, and apps with a frontend and backend developed hand-in-hand.

Large companies,
[such as Netflix](https://grpc.io/about/#cases-who-s-using-it-and-why) and [Google](https://grpc.io/faq/#who-s-using-this-and-why),
are starting to replace REST/GraphQL with RPC
for their internal APIs.
Most notably with [gRPC](https://grpc.io/) which is increasingly popular in the industry.

Both gRPC and Wildcard are RPC tools.
While gRPC focuses on cross-platform support (Go, Python, Java, C++, etc.),
Wildcard only supports the Node.js-browser stack.
This allows Wildcard to have a simple design (with a mere 1.1K-LOCs) and to be super easy to use.

Wildcard's simplicity and flexibility excel most for prototypes that are quickly evolving.

If you are a full-stack JavaScript developer using a framework such as Next.js or Nuxt, and your frontend is the only consumer of your backend's API, then Wildcard is, compared to REST/GraphQL, superior in virtually every way.

If you are unfamiliar with RPC,
then check out [RPC vs REST/GraphQL](/docs/rpc.md#rpc-vs-restgraphql).

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Getting Started

This getting started is about adding Wildcard to an exisiting app.
If you don't already have an app or if you just want to try out Wildcard,
you can use a [Reframe starter](https://github.com/reframejs/reframe#getting-started) to quickly get started.

1. Add Wildcard to your Node.js server.

   With Express:
   ~~~js
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

     // The `requestProps` object is available in your endpoint functions as `this`.
     // For example, you can add `req.headers` to `requestProps` to be
     // able to access it in your endpoint functions as `this.headers`.
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

       // The `requestProps` object is available in your endpoint functions as `this`.
       // For example, you can add `request.headers` to `requestProps` to be
       // able to access it in your endpoint functions as `this.headers`.
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

     // The `requestProps` object is available in your endpoint functions as `this`.
     // For example, you can add `ctx.request.headers` to `requestProps` to be
     // able to access it in your endpoint functions as `this.headers`.
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

       // The `requestProps` object is available in your endpoint functions as `this`.
       // For example, you can add `req.headers` to `requestProps` to be
       // able to access it in your endpoint functions as `this.headers`.
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

2. Define an endpoint function
   in Node.js:

   ~~~js
   // Node.js

   const {endpoints} = require('wildcard-api');

   endpoints.myFirstEndpoint = async function () {
     // The `this` object is the `requestProps` object we passed to `getApiResponse`. Because
     // the headers are set on `requestProps.headers`, we can access them over `this.headers`.
     // You can then, for example, use the headers for authentication.
     console.log('The HTTP request headers:', this.headers);

     return {msg: 'hello from my first Wildcard endpoint';
   };
   ~~~

3. You can now "call" your enpdoint function from you frontend:

   ~~~js
   // Browser

   import {endpoints} from 'wildcard-api/client'; // npm install wildcard-api

   (async () => {
     const {msg} = await endpoints.myFirstEndpoint();
     console.log(msg);
   })();
   ~~~

!INLINE ./snippets/section-footer.md #readme --hide-source-path




## Authentication

Authentication usually uses HTTP headers
such as `Authorization: Bearer AbCdEf123456` or a cookie holding the user's session ID.

You can access the HTTP request headers in your endpoint functions by passing the `headers` object to `getApiResponse`:

~~~js
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
// Node.js

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
see [SSR & Authentication](/docs/ssr-auth.md#readme).

!INLINE ./snippets/section-footer.md #readme --hide-source-path




## Permissions

Permission is defined by code. For example:

~~~js
// Node.js

const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const db = require('./path/to/your/db/handler');

// The following endpoint showcases how to implement permissions with Wildcard.
// The endpoint only allows the author of a todo-item to modify it.

endpoints.updateTodoText = async function(todoId, newText) {
  if( !user ) {
    // The user is not logged-in.
    // We abort.
    return;
  }

  const todo = await db.getTodo(todoId);

  if( !todo ) {
    // `todoId` didn't match any todo.
    // We abort.
    return;
  }

  if( todo.authorId !== user.id ) {
    // The user is not the author of the to-do item.
    // We abort.
    return;
  }

  // The user is logged-in and is the author of the todo.
  // We commit the new to-do text.
  await db.updateTodoText(todoId, newText);
};
~~~

See the [to-do list app example](/example/) for further permission examples.

!INLINE ./snippets/section-footer.md #readme --hide-source-path





## Error Handling

Calling an endpoint throws an error when:
 - The browser cannot connect to the server. (The user is offline or your server is down.)
 - The endpoint function throws an uncaught error.

If you use a library that is expected to throws errors, then catch them:

~~~js
// Node.js

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
// Node.js

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

Otherwise read [SSR & Authentication](/docs/ssr-auth.md#readme).

!INLINE ./snippets/section-footer.md #readme --hide-source-path





## Options

> :information_source:
> If you need an option that Wildcard is missing, then
> [open a new GitHub issue](https://github.com/reframejs/wildcard-api/issues/new).
> We usually implement new options within 1-2 days.

Overview of all options:

~~~js
import {WildcardClient} from 'wildcard-api/client';

const endpoints = new WildcardClient({
  // The URL of the Node.js server that serves the API
  serverUrl: null, // Default value

  // Whether the endpoint arguments are always passed in the HTTP body
  argumentsAlwaysInHttpBody: false, // Default value
});
~~~

More details about each option:

- [`serverUrl`](#serverurl)
- [`argumentsAlwaysInHttpBody`](#argumentsalwaysinhttpbody)

<br/>

### `serverUrl`

Wildcard automatically determines the adress of the server and you
don't need to provide `serverUrl`.

But if the Node.js server that serves the API is not the same server that serves your browser-side assets,
then you need to provide `serverUrl`.

For example:

~~~js
import {WildcardClient} from 'wildcard-api/client';
// (Or `const {WildcardClient} = require('wildcard-api/client');`)
import assert from 'assert';

const endpoints = new WildcardClient({
  serverUrl: 'https://api.example.com:1337',
});

callEndpoint();

async function callEndpoint() {
  await endpoints.myEndpoint();

  assert(window.location.origin==='https://example.com');

  // Normally, Wildcard makes HTTP requests to the same origin:
  //   POST https://example.com/wildcard/myEndpoint HTTP/1.1

  // But because we have set `serverUrl`, Wildcard makes
  // the HTTP requests to `https://api.example.com:1337`:
  //   POST https://api.example.com:1337/wildcard/myEndpoint HTTP/1.1
};
~~~

<br/>

### `argumentsAlwaysInHttpBody`

`argumentsAlwaysInHttpBody` is about configuring whether
arguments are always passed in the HTTP request body.
(Instead of being passed in the HTTP request URL.)

For example:

~~~js
import {WildcardClient} from 'wildcard-api/client';
// (Or `const {WildcardClient} = require('wildcard-api/client');`)

const endpoints = new WildcardClient({
  argumentsAlwaysInHttpBody: true,
});

callEndpoint();

async function callEndpoint() {
  await endpoints.myEndpoint({some: 'arguments' }, 'second arg');

  // Normally, Wildcard passes the arguments in the HTTP request URL:
  //   POST /wildcard/myEndpoint/[{"some":"arguments"},"second arg"] HTTP/1.1

  // But because we have set `argumentsAlwaysInHttpBody` to `true`,
  // Wildcard passes the arguments in the HTTP request body instead:
  //   POST /wildcard/myEndpoint HTTP/1.1
  //   Request payload: [{"some":"arguments"},"second arg"]
};
~~~

!INLINE ./snippets/section-footer.md #readme --hide-source-path





## More Resources

This section collects further information about Wildcard.

 - [SSR & Authentication](/docs/ssr-auth.md#readme)
   <br/>
   How to use Wildcard with SSR and Authentication.

 - [How Does It Work](/docs/how-does-it-work.md#readme)
   <br/>
   Explains how Wildcard works.

 - [Conceptual FAQ](/docs/conceptual-faq.md#readme)
   <br/>
   High level discussion about Wildcard, RPC APIs, GraphQL, and REST.

 - [To-do List Example](/example#readme)
   <br/>
   An example of a to-do list app implemented with Wildcard.

 - [Custom VS Generic](/docs/custom-vs-generic.md#readme)
   <br/>
   Goes into depth of whether you should implement a generic API (REST/GraphQL),
   or a custom API (Wildcard),
   or both.
   In general, the rule of thumb for deciding which one to use is simple:
   if third parties need to access your data,
   then implement a generic API,
   otherwise implement a custom API.
   But in certain cases it's not that easy and this document goes into more depth.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



