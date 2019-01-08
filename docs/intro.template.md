!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path

<br/>

Small JavaScript library to create an API between your Node.js server and your browser frontend.

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
  const {message} = await endpoints.hello('Alice');
  console.log(message); // Prints `Hi Alice`
})();
~~~

That's all Wildcard does:
it makes functions defined on the server "callable" in the browser.
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

###### Wildcard vs REST/GraphQL

REST and GraphQL are great tools to
enable an ecosystem of third-party applications built on top of your data;
with REST and GraphQL you create a generic API.
That is, an API that aims to be able to fulfill a maximum number of data requirements,
allowing all kinds of third-party applications to be built.

With Wildcard,
instead of a generic API,
you create a custom API:
an API that is consumed by your clients,
and only by your clients.
A custom API only fulfills the data requirements of your clients.
If you don't need third parties to be able to access your data,
then a custom API offers a simple alternative.

We further compare Wildcard with REST/GraphQL
and custom APIs with generic APIs in the FAQ.

#### Contents

 - [Usage](#usage)
 - [FAQ](#faq)

<br/>

## Usage

1. Add the Wildcard routes to your Node.js server.

   With Express:
   ~~~js
   const express = require('express');
   const {getApiResponse} = require('wildcard-api'); // npm install wildcard-api

   const app = express();

   app.all('/wildcard/*' , async (req, res, next) => {
     const {body, statusCode} = await getApiResponse(req);
     res.status(statusCode);
     res.send(body);
     next();
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
       const {body, statusCode} = await getApiResponse(request.raw.req);
       const resp = h.response(body);
       resp.code(statusCode);
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

   router.all('/wildcard/*', async (ctx, next) => {
     const {body, statusCode} = await getApiResponse(ctx);
     ctx.status = apiResponse.statusCode;
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
   Just make sure to reply any HTTP request made to `/wildcard/*`
   with an HTTP response with the HTTP body and status code returned by
   `const {body, statusCode} = await getApiResponse({method, url, headers});`
   where `method`, `url`, and `headers` are the HTTP request method, URL, and headers.
   </details>

2. You can then define functions
   in Node.js on
   `require('wildcard-api').endpoints`...

   ~~~js
   // Node.js

   const {endpoints} = require('wildcard-api');
   const getLoggedUser = require('./path/to/your/auth/code');
   const getData = require('./path/to/your/data/retrieval/code');

   endpoints.myFirstEndpoint = async function () {
     // `this` is the object you pass to `getApiResponse`.
     // In the Express code above we passed `req` and we can
     // access `req.headers.cookie` over `this.headers.cookie`.
     const user = await getLoggedUser(this.headers.cookie);
     const data = await getData(user);
     return data;
   };
   ~~~

   ...and "call" them in the browser
   at `require('wildcard-api/client').endpoints`.

   ~~~js
   // Browser

   import {endpoints} from 'wildcard-api/client';

   (async () => {
     const data = await endpoints.myFirstEndpoint();
   })();
   ~~~

> You can also scaffold a Reframe + Wildcard API stack using
> [Reframe's react-sql starter](https://github.com/reframejs/reframe/tree/master/plugins/create/starters/react-sql#readme)

!INLINE ./snippets/intro-section-footer.md --hide-source-path




## FAQ

###### Conceptual

- [How does Wildcard compare to GraphQL/REST?](#how-does-wildcard-compare-to-graphqlrest)
- [Isn't GraphQL more powerful than Wildcard?](#isnt-graphql-more-powerful-than-wildcard)
- [I can create a custom API myself, do I need Wildcard?](#i-can-create-a-custom-api-myself-do-i-need-wildcard)
- [Isn't Wildcard just RPC?](#isnt-wildcard-just-rpc)

###### Usage

- [What about authentication? Where are the HTTP headers?](#what-about-authentication-where-are-the-http-headers)
- [What about permission?](#what-about-permission)
- [How does it work?](#how-does-it-work)
- [What happens upon network errors?](#what-happens-upon-network-errors)
- [Does the Wildcard client work in Node.js?](#does-the-wildcard-client-work-in-nodejs)
- [Does it work with SSR?](#does-it-work-with-ssr)

### How does Wildcard compare to GraphQL/REST?

They have different goals.

With GraphQL/REST you create a generic API
that aims to fulfill a maximum number of data requirements;
enabling third parties to build applications on top of your data.

With Wildcard you create a custom API
that fulfills the data requirements of your clients and your clients only.

If your goal is to have an ecosystem of third-party applications,
then you need a generic API and you'll have to use something like REST/GraphQL.

If your goal is to retrieve and mutate data from your frontend,
then Wildcard offers a simple alternative.

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### Isn't GraphQL more powerful than Wildcard?

Yes and no.

From the perspective of a third-party,
yes,
GraphQL is more powerful.

But,
from the perspective of your frontend development,
things are different;
with Wildcard,
everything the backend can do is only one JavaScript function away:

~~~js
// Your Node.js server

const endpoints = require('wildcard-api');

endpoints.iHavePower = function() {
  // I can do anything the Node.js server can do
};
~~~
~~~js
// Your browser frontend

const endpoints = require('wildcard-api/client');

// The backend power is one JavaScript function away
endpoints.iHavePower();
~~~

The whole power of your backend is at your disposal while developing your frontend.
For example,
you can use any NoSQL/SQL/ORM query to retrieve and mutate data.
That's arguably more powerful than GraphQL.

(The distinctive difference between a third party and your frontend development is that
*you* can modify the custom API;
from the perspective of a third party,
your custom API is set in stone,
but,
from your perspective,
your custom API can be modified at will while developing your frontend.)

GraphQL is a wonderful addition to our dev toolbox.
But unfortunately,
GraphQL's hype made us forget how great custom APIs are.
Let's remember.

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### I can create a custom API myself, do I need Wildcard?

Instead of Wildcard,
you can create a custom API yourself by manually adding HTTP routes to your web server.

Wildcard is just a little tool that takes care of:
 - Serialization
 - Caching
 - SSR

If you want control over these things,
then don't use Wildcard.
Although note that these things are less trivial than you might think.
(For example we use [JSON-S](https://github.com/brillout/json-s) instead of JSON.)

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### Isn't Wildcard just RPC?

Yes,
Wildcard is basically
[RPC](https://en.wikipedia.org/wiki/Remote_procedure_call)
between your browser frontend and your Node.js server.

RPC existed long before REST.
(Xerox PARC being among the first to implement RPC in the early 1980s
while REST was introduced only in the early 2000s.)

So, why should one use RPC instead of REST/GraphQL today?

When REST came out,
it allowed internet companies
to expose their data
to third parties in a safe and standardized way.
Large companies
soon realized the potential:
a RESTful API
allowed them
to become platforms with
a flurishing ecosystem
of third-party applications built on top of their RESTful API.
REST became the de facto standard for public APIs.

GraphQL is a great step forward:
it allows third parties to retrieve data that were previously difficult (or even not possible) to retrieve with a RESTful API.
GraphQL allows for a even more prospereous ecosystem of third-party applications.
Large companies,
such as Facebook and GitHub,
now expose their data as a GraphQL API,
reinforcing their position as a platform.

If you want to enable an ecosystem of third-party applications built on top of your data,
then setting up a generic API,
such as with REST or GraphQL,
is an obligatory step.

This is not Wildcard's use case.
An API created with Wildcard is meant to be consumed by your clients and your clients only.
Such API is not generic and,
from the perspective of a third party,
a Wildcard API doesn't make sense.
(Nor does any custom API or RPC-like API.)

But if your goal is to retrieve/mutate data from your frontend,
then Wildcard
offers a simple alternative.
(So does any custom API or RPC-like API.)

The advent of REST and GraphQL
spur the rise of vast ecosystems of third-party apps.
That's wonderful.
But sadly,
their success is casting a shadow over RPC;
even though RPC is (and always was) a great way of communicating between two remote processes.

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### What about authentication? Where are the HTTP headers?

The `context` object you pass to `getApiResponse(context)`
is available to your endpoint functions as `this`.
That way,
you can pass request information to your endpoint functions,
such as HTTP headers.

For example, when using Express, you can pass the `req` object:

~~~js
 async (req, res, next) => {
   // We use `req` as context
   const apiResponse = await getApiResponse(req);
   // ...
 });
~~~

Your endpoint functions will then be able to access the HTTP headers:

~~~js
endpoints.getLoggedUserInfo = async function() {
  // Since `this===req`, `req.headers` is available as `this.headers`
  const user = await getUserFromSessionCookie(this.headers.cookie);
  return user;
};
~~~

Or when using Express with [Passport](https://github.com/jaredhanson/passport):

~~~js
endpoints.getLoggedUserInfo = async function() {
  // When using Passport, `req.user` holds the logged-in user.
  // And since `this===req`, `req.user` is available as `this.user`.
  return this.user;
};
~~~

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### What about permission?

Permission is specifided by code.
For example:

~~~js
const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const db = require('path/to/your/favorite/sql/query/builder');

// An endpoint for a to-do list app to update the text of a todo

endpoints.updateTodoText = async function(todoId, newText) {
  const user = await getLoggedUser(this.headers.cookie);
  // Do nothing if the user is not logged in
  if( !user ) return;

  const [todo] = await db.query(
    `SELECT * FROM todos WHERE id = :todoId;`,
    {todoId}
  );

  // The `updateTodoText` function is essentially public; `todoId` can
  // hold any value and doesn't have to be a todo's id.
  if( !todo ) {
    // Abort if `todoId` doesn't match a todo's id.
    return;
  }

  // This if-block ensures the following: if the logged user is not the
  // todo's author, then it cannot change the todo's text.
  if( todo.authorId !== user.id ) {
    // Abort if the user is not the todo's author
    return;
  }

  // The logged user is the todo's author and we update the
  // todo's text
  await db.query(
    "UPDATE todos SET text = :newText WHERE id = :todoId;",
    {newText, todoId}
  );
};
~~~

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### How does it work?

When calling `endpoints.endpointName('some', {arg: 'val'});` in the browser the following happens:

1. [Browser]
   The arguments are serialized to `"["some",{"arg":"val"}]"`
   and an HTTP request is made to `/wildcard/endpointName/"["some",{"arg":"val"}]"`.
   (Serialization is done with [JSON-S](https://github.com/brillout/json-s).)

2. [Node.js]
   The arguments are deserialized back to `{arg: 'val'}`
   and your endpoint function (defined on `endpoints.endpointName` in Node.js) is called.

3. [Node.js]
   Once your endpoint function's promise resolves,
   the resolved value is serialized and sent to the browser in an HTTP response.

5. [Browser]
   The received HTTP response is deserialized and the promise of your original `endpoints.endpointName` call is resolved.

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### What happens upon network errors?

Wildcard uses the Fetch API
and doesn't catch errors thrown by `fetch()`,
allowing you to handle network errors as you wish.

You can also load
[Handli](https://github.com/brillout/handli)...

~~~js
import 'handli';
/* Or:
require('handli')`;
*/
~~~

...and Wildcard will automatically use Handli to handle network errors.

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### Does the Wildcard client work in Node.js?

Yes.

If the Wildcard client and the Wildcard server run in the same Node.js process
then, instead of doing an HTTP request, the endpoint function is directly called.

Otherwise the Wildcard client makes an HTTP request like when run in the browser.

!INLINE ./snippets/faq-section-footer.md --hide-source-path

### Does it work with SSR?

Yes.
But you have to provide the request context when running the Wildcard client on the server-side.

You can use `Function.prototype.bind()` to do so:

~~~js
const {endpoints} = require('wildcard-api/client');

async function getInitialProps({isNodejs, request: {headers}={}}) {
  let {getLandingPageData} = endpoints;

  // When calling `getLandingPageData` on the server, we have to
  // preserve the request context.
  if( isNodejs ) {
    // E.g. we pass on the HTTP headers of the original HTTP request:
    const context = {headers};
    getLandingPageData = getLandingPageData.bind(context);
  }

  const landingPageData = await getLandingPageData();
  return landingPageData;
}
~~~

The endpoint `getLandingPageData` then always has access to `headers`:

~~~js
const {endpoints} = require('wildcard');
const getLoggedUser = require('./path/to/your/auth/code');

endpoints.getLandingPageData = async function(){
  const user = await getLoggedUser(this.headers);
  // ...
};
~~~

When the Wildcard client runs in Node.js,
the context `this` originates from our `bind` call above.
And when the Wildcard client runs in the browswer, `this` originates from `getApiResponse`:

~~~js
const express = require('express');
const {getApiResponse} = require('wildcard-api');

const app = express();

app.all('/wildcard/*' , async(req, res, next) => {
  const {url, method, headers} = req;
  const context = {url, method, headers};
  const apiResponse = await getApiResponse(context);

  res.status(apiResponse.statusCode);
  res.send(apiResponse.body);

  next();
});
~~~

!INLINE ./snippets/faq-section-footer.md --hide-source-path
