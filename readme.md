<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=80 alt="Wildcard API"/>
  </a>
</p>

<p align="center">Easy API for Node.js <-> Browser</p>

<br/>

 - [What is Wildcard?](#what-is-wildcard)
 - [Wildcard VS REST/GraphQL](#wildcard-vs-restgraphql)
 - Usage
   - [Installation & Setup](#installation--setup)
   - [Authentication](#authentication)
   - [Authorization](#authorization)
   - [Network Errors](#network-errors)
   - [SSR](#ssr)
   - [`onEndpointCall`](#onEndpointCall)
 - [More Resources](#more-resources)

<br/>

### What is Wildcard?

Wildcard is a JavaScript library to create an API between your Node.js server and your browser frontend.

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
you can use any SQL/NoSQL/ORM query:

~~~js
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

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



### Wildcard VS REST/GraphQL

**REST and GraphQL are tools to create a _generic API_**:
your data can be retrieved/mutated in all kinds of ways.
The more data is retrievable/mutable, the better.
So that third parties can build all kinds of apps on top of your data.

**Wildcard is a tool to create a _custom API_**:
your data is retrieved/mutated by you and you only.
For example if your data is only retrieved/mutated by your React/Vue/Angular frontend.

If you want third parties to be able to retrive/mutate your data,
use REST/GraphQL.
But,
if all you want to do is to retrieve/mutate your data from your React/Vue/Angular frontend,
then Wildcard offers an alternative
that is vastly simpler:
all you need to know to use Wildcard is written in this readme.

If you are a startup and
you want to quickly ship/evolve your product,
then we believe that Wildcard is the way go.
(Wildcard is actually already used by couple of startups.)

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



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

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



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

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



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

See the [to-do list app example](/example/) for further permission examples.

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



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

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



### SSR

The Wildcard client is universal and works on both the browser and Node.js.

If you don't need Authentication, then SSR works out of the box.

If you need Authentication, then read [SSR & Authentication](/doc/ssr-auth.md#readme).

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



### `onEndpointCall`

The `require('wildcard-api').onEndpointCall` hook allows you to intercept and listen to all endpoint calls.

This gives you full control.
To do things such as logging or custom error handling:

~~~js
const wildcardApi = require('wildcard-api');

wildcardApi.onEndpointCall = ({
  // The HTTP request object
  req,

  // The name of the endpoint that has been called
  endpointName,

  // The arguments passed to the endpoint
  endpointArgs,

  // The error thrown by the endpoint function, if any
  endpointError,

  // The value returned by the endpoint function
  endpointResult,

  // Overwrite the value returned by the endpoint function
  overwriteResult,

  // Overwrite the HTTP response of the endpoint
  overwriteResponse,
}) => {
  // For example, logging:
  console.log('New call to '+endpointName+' from User Agent '+req.headers['user-agent']);

  // If you want to overwrite the endpoint result:
  overwriteResult({message: 'this is an overwriting message'});

  // Or if you want to custom handle server errors:
  if( endpointError ) {
    overwriteResponse({
      statusCode: 500,
      type: 'text/html',
      body: "<html><body><b>There was an internal error. We have been notified.</b><body><html/>",
    });
  }
};
~~~

See [test/tests/onEndpointCall.js](test/tests/onEndpointCall.js) for more examples.

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>



### More Resources

This section collects further information about Wildcard.

 - [SSR & Authentication](/doc/ssr-auth.md#readme)
   <br/>
   How to use Wildcard with SSR and Authentication.

 - [How does it work](/docs/how-does-it-work.md#readme)
   <br/>
   Explains how Wildcard works.

 - [Conceptual FAQ](/docs/conceptual-faq.md#readme)
   <br/>
   High level discussion about Wildcard, RPC-like APIs, GraphQL, and REST.

 - [Custom VS Generic](/docs/custom-vs-generic.md#readme)
   <br/>
   Goes into more depth of whether you should implement a generic API (REST/GraphQL) or a custom API (Wildcard).
   (Or both.)
   In general, the rule of thumb for deciding which one to use is simple:
   if third parties need to access your data,
   then implement a generic API,
   otherwise implement a custom API.
   But in some cases it's not that easy and this document goes into more depth.

 - [To-do List Example](/example#readme)
   <br/>
   An example of a to-do list app implemented with Wildcard.

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>




<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/intro.template.md` instead.






-->
