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

   With [Express](https://github.com/expressjs/express):
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
   With [Hapi](https://github.com/hapijs/hapi)
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
   With [Koa](https://github.com/koajs/koa)
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
     // `this` is the object you pass to `getApiResponse`
     // In the Express code above we passed `req` and we can
     // access `req.headers.cookie` over `this.headers.cookie`.
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

Flexibility is paramount
when prototyping,
and Wildcard's structureless nature is a great fit.
Whereas the rigid structure of a generic API
gets in the way of quickly evolving a prototype.

Also,
Wildcard is trivial to setup,
allowing you to quickly ship a prototype.

We go in depth and explore different use cases at
[Usage Manual - Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api).

### How does a Wildcard API compare to a GraphQL API / RESTful API?

Comparing Wildcard with REST and GraphQL mostly boils down to comparing a custom API with a generic API.
See
[Usage Manual - Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api).

### How about authentication? Where are the HTTP headers?

Any object `context` you pass to `getApiResponse(context)`
is available to your endpoint functions as `this`.
So that you can pass the information your endpoint functions need, such as HTTP headers.

For example you can pass Express's `req` object:

~~~js
 async (req, res, next) => {
   // We use `req` as request context
   const apiResponse = await getApiResponse(req);
   // ...
 });
~~~

to then be able to access the cookie header:

~~~js
endpoints.getLoggedUserInfo = async function() {
  // Since `this===req` we can access `req.headers` with `this.headers`
  const user = await getUserFromSessionCookie(this.headers.cookie);
  return user;
};
~~~

Or when using Express with [Passport](https://github.com/jaredhanson/passport):

~~~js
endpoints.getLoggedUserInfo = async function() {
  // When using Passport, `req.user` holds the logged in user.
  // And since `this===req` we can access `req.user` with `this.user`.
  return this.user;
};
~~~

### How about permissions? Is it safe?

Unlike generic APIs where safety is ensured with declarative permission rules,
safety is ensured by your code.

For example for a to-do list app with a SQL database:

~~~js
endpoints.updateTodoText = async function(todoId, newText) {
  const user = await getLoggedUser(this.headers.cookie);
  // Do nothing if the user is not logged in
  if( !user ) return;

  const [todo] = await db.query(
    `SELECT * FROM todos WHERE id = :todoId;`,
    {todoId}
  );
  if( !todo ) {
    // In essence `updateTodoText` is public, and `todoId`
    // can hold any value and doesn't have to be the id of a todo.
    return;
  }

  // Do nothing if the user is not the author of the todo
  if( todo.authorId !== user.id ) {
    // The logged user is not the auther of the todo and doesn't
    // have the permission to change the todo's text.
    return;
  }

  // The logged user is the todo's author and has permission
  await db.query(
    "UPDATE todos SET text = :newText WHERE id = :todoId;",
    {newText, todoId}
  );
};
~~~


### How does it work?

When calling `endpoints.endpointName('some', {arg: 'val'});` in the browser the following happens:

1. The arguments are serialized to `"["some",{"arg":"val"}]"` using [JSON-S](https://github.com/brillout/json-s).
   (All (de-)serialization is made with JSON-S.)

2. An HTTP request is made to `/wildcard/endpointName/"["some",{"arg":"val"}]"` to your Node.js server

3. On your Node.js server, your endpoint function defined on `endpoints.endpointName` is called with the arguments deserialized back to `{arg: 'val'}`

5. Once your endpoint function's return promise resolves,
   an HTTP response is replied with the promise's resolved value serialized in the HTTP body.

6. In the browser,
   the HTTP body is deserialized and the promise of your original `endpoints.endpointName` call is resolved with the deserialized HTTP body.



### What happens upon network errors?

Wildcard uses fetch and doesn't catch fetch's errors allowing you to handle network errors as you wish.

You can also load
[Handli](https://github.com/brillout/handli)...

~~~js
import 'handli';
// Or: `require('handli')`;
~~~

...and Wildcard will then automatically use Handli to handle network errors.


### Does the Wildcard client work in Node.js?

Yes.

If the Wildcard client and Wildcard server run in the same Node.js process
then, instead of doing a HTTP request, the endpoint function is then directly called.

Otherwise the Wildcard client will make a HTTP request like when run in the browser.

### Does it work with SSR?

Yes.
But you'll have to manually preserve the request context when running the Wildcard client on the server-side.

You can use the `Function.prototype.bind()` method to do so:

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

The endpoint `getLandingPageData` then has access to `headers`:

~~~js
const {endpoints} = require('wildcard');

endpoints.getLandingPageData = async function(){
  const {headers} = this;

  const user = await getLoggedUser(headers);

  const moreInfo = await getMoreInfo();

  return {user, ...moreInfo};
};
~~~

When the Wildcard client runs in Node.js,
the context originates from our `bind` call above.

When the Wildcard client runs in the browswer, the context originates from `getApiResponse`:

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

!INLINE ./snippets/usage-section-footer.md --hide-source-path


