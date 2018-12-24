!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path
!MENU

<br/>
<p>
With Wildcard,
creating an API endpoint is as easy as creating a JavaScript function:
</p>

~~~js
// Node.js Server

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
It makes functions defined on the server "callable" in the browser.
Nothing more, nothing less.
How you retrieve/mutate data is up to you.

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

   You can use Wildcard with any server framework as long as you
   reply HTTP requests made to `/wildcard/*`
   with the HTTP response body and status code returned by
   `const {body, statusCode} = await getApiResponse({method, url, headers});`
   where `method`, `url`, and `headers` are the HTTP request method, URL, and headers.
   </details>

2. Functions you define
   in Node.js on
   `require('wildcard-api').endpoints`...

   ~~~js
   // Node.js

   const {endpoints} = require('wildcard-api');

   endpoints.myFirstEndpoint = async function () {
     // `this` is the object that you pass to `getApiResponse`
     // In the Express code above we passed `req`. So we have `this===req`
     // and we can access `req.headers.cookie` over `this.headers.cookie`.
     const loggedInUser = await getLoggedInUser(this.headers.cookie);
     const data = await getData(loggedInUser);
     return data;
   };
   ~~~

   ...are then "available" in the browser
   at `require('wildcard-api/client').endpoints`.

   ~~~js
   // Browser

   import {endpoints} from 'wildcard-api/client';

   (async () => {
     const data = await endpoints.myFirstEndpoint();
   })();
   ~~~

> You can also scaffold a full-stack app with a Wildcard API using [Reframe's react-sql starter](https://github.com/reframejs/reframe/tree/master/plugins/create/starters/react-sql#readme)

!INLINE ./snippets/intro-section-footer.md --hide-source-path




## FAQ

### Should I create a Wildcard API or a GraphQL/RESTful API?

For prototypes we recommend Wildcard and
for large applications we recommand REST or GraphQL.

Flexibility is paramount when prototyping,
and Wildcard's structureless nature is a great fit.
Whereas the rigid structure of a generic API
gets in the way of quickly evolving your prototype.

Also,
Wildcard is trivial to setup,
allowing you quickly ship a prototype.

We go in more depth and explore different use cases at
[Usage Manual - Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api).

### How does a Wildcard API compare to a GraphQL API / RESTful API?

Comparing Wildcard with REST and GraphQL mostly boils down to comparing a custom API with a generic API.
See
[Usage Manual - Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api).

### How about authentication? Where are the HTTP headers?

The object `context` passed to `getApiResponse(context)`
is available to endpoint functions as `this`.

~~~js
endpoints.getLoggedUserInfo = async function() {
  const userthis.headers.cookie
  // Or, for example, when using Express's authentication library Passport,
  // the logged user is available at `req.user`.
  // Since `this.req` we can access it at
  // :using your server's fram
  const loggedUser = this.user;
  return loggedUser;
};
~~~

### How about permissions? Is it safe?

Yes it's safe but it's your job.

For example, if you SQL:

~~~js
endpoints.updateTodoText = async function(todoId, newText) {
  const user = await getLoggedUser(this.headers.cookie);
  // Do nothing if user is not logged in
  if( !user ) return;

  const [todo] = await db.query(
    `SELECT * FROM todos WHERE id = :todoId;`,
    {todoId}
  );
  if( !todo ) {
    // Because `updateTodoText` is essentialy public, `todoId` can be anything
    // and it doesn't have to be the id of a todo.
    // (What were are doing here is bascailly validation.)
    return;
  }

  // Do nothing if the user is not the author of the todo
  if( todo.authorId !== user.id ) {
    // (What we are doing here is basically permission control.)
    return;
  }

  await db.query(
    "UPDATE todos SET text = :newText WHERE id = :todoId;",
    {newText, todoId}
  );
};
~~~


### How does it work?

In contrast, with Wildcard, you simply define JavaScript functions on Wildcard's `endpoints` object.
No schema,
no permission rules.

In essence,
these endpoint functions you define act as fine-grained "permission holes":
You allow your client to access and do things on a case-by-case basis.
This is a simple alternative to permission rules.

That said, Wildcard is not suitable for:
 - Third-party clients.
 - Large applications with an API developed independently of the frontend.



!INLINE ./snippets/intro-section-footer.md --hide-source-path

