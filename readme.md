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
<p align='center'><a href="/../../#readme"><b>Intro</b></a> &nbsp; | &nbsp; <a href="/docs/custom-vs-generic.md#readme">Custom vs Generic</a> &nbsp; | &nbsp; <a href="/example/#readme">Example</a></p>

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

   endpoints.myFirstEndpoint = async function () {
     // `this` is the object you pass to `getApiResponse`.
     // In the Express code above we passed `req` and we can
     // access `req.headers.cookie` over `this.headers.cookie`.
     const loggedInUser = await getLoggedInUser(this.headers.cookie);
     const data = await getData(loggedInUser);
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

<b><sub><a href="#contents">&#8679; TOP  &#8679;</a></sub></b>

<br/>




## FAQ

- [Should I create a Wildcard API or a GraphQL/RESTful API?](#should-i-create-a-wildcard-api-or-a-graphqlrestful-api)
- [How does Wildcard compare to GraphQL/RESTful?](#how-does-wildcard-compare-to-graphqlrestful)
- [What about authentication? Where are the HTTP headers?](#what-about-authentication-where-are-the-http-headers)
- [What about permission?](#what-about-permission)
- [How does it work?](#how-does-it-work)
- [What happens upon network errors?](#what-happens-upon-network-errors)
- [Does the Wildcard client work in Node.js?](#does-the-wildcard-client-work-in-nodejs)
- [Does it work with SSR?](#does-it-work-with-ssr)

### Should I create a Wildcard API or a GraphQL/RESTful API?

We recommend Wildcard for prototypes, small- and medium-sized applications.
For large applications we recommend REST/GraphQL.

Wildcard is trivial to setup and its structureless nature is a good fit for prototyping.
(Whereas the rigid structure of REST/GraphQL gets in the way of quickly evolving a prototype.)

We explore use cases in more depth at
[Custom vs Generic](/docs/custom-vs-generic.md).

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>

### How does Wildcard compare to GraphQL/RESTful?

Comparing Wildcard with REST/GraphQL mostly boils down to comparing a custom API with a generic API,
see
[Custom vs Generic](/docs/custom-vs-generic.md).

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>

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

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>

### What about permission?

With Wildcard,
permission is specifided by code.

For example:

~~~js
// An endpoint for a to-do list app to update a todo's text

endpoints.updateTodoText = async function(todoId, newText) {
  const user = await getLoggedInUser(this.headers.cookie);
  // Do nothing if the user is not logged in
  if( !user ) return;

  const [todo] = await db.query(
    `SELECT * FROM todos WHERE id = :todoId;`,
    {todoId}
  );

  // `updateTodoText` is essentially public; `todoId` can hold
  // any value and doesn't have to be a todo's id.
  if( !todo ) {
    // Abort if `todoId` doesn't match a todo's id.
    return;
  }

  // This if block ensures that, if the logged user is not the
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

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>

### How does it work?

When calling `endpoints.endpointName('some', {arg: 'val'});` in the browser the following happens:

1. [Browser]
   The arguments are serialized to `"["some",{"arg":"val"}]"`,
   and an HTTP request is made to `/wildcard/endpointName/"["some",{"arg":"val"}]"`.
   (Serialization is done with [JSON-S](https://github.com/brillout/json-s).)

2. [Node.js]
   The arguments are deserialized to `{arg: 'val'}`,
   and your endpoint function, defined on `endpoints.endpointName` in Node.js, is called.

3. [Node.js]
   Once your endpoint function's promise resolves,
   the resolved value is serialized and sent to the browser in an HTTP response.

5. [Browser]
   The received HTTP response is deserialized and the promise of your original `endpoints.endpointName` call is resolved.

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>

### What happens upon network errors?

Wildcard uses fetch and doesn't catch fetch's errors,
allowing you to handle network errors as you wish.

You can also load
[Handli](https://github.com/brillout/handli)...

~~~js
import 'handli';
// Or: `require('handli')`;
~~~

...and Wildcard will then automatically use Handli to handle network errors.

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>

### Does the Wildcard client work in Node.js?

Yes.

If the Wildcard client and the Wildcard server run in the same Node.js process
then, instead of doing an HTTP request, the endpoint function is directly called.

Otherwise the Wildcard client makes an HTTP request like when run in the browser.

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>

### Does it work with SSR?

Yes.
But you have to provide the request context when running the Wildcard client on the server-side.

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

The endpoint `getLandingPageData` then always has access to `headers`:

~~~js
const {endpoints} = require('wildcard');

endpoints.getLandingPageData = async function(){
  const user = await getLoggedUser(this.headers);
  // ...
};
~~~

When the Wildcard client runs in Node.js,
the context originates from our `bind` call above.
And when the Wildcard client runs in the browswer, the context originates from `getApiResponse`:

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

<b><sub><a href="#faq">&#8679; TOP  &#8679;</a></sub></b>
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
