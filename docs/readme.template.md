!OUTPUT ../readme.md
!INLINE ./snippets/header.md --hide-source-path

<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[What is Telefunc](#what-is-telefunc)
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
[Validation](#validation)
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
[API Documentation](#api-documentation)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Caching](#caching)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[SSR](#ssr)
<br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8226;&nbsp;
[Options](#options)

<br/>

## What is Telefunc

Telefunc is a JavaScript/TypeScript library to create an API-less app by using so-called *tele*functions.

```js
// Node.js server

const { server } = require("telefunc/server");

// We define a `hello` function on the server
server.hello = function (name) {
  return { message: "Welcome " + name };
};
```

```js
// Browser

import { server } from "telefunc/client";

(async () => {
  // Telefunc makes our `hello` function available in the browser.
  const { message } = await server.hello("Elisabeth");
  console.log(message); // Prints `Welcome Elisabeth`
})();
```

Instead of creating API endpoints, you create _telefunctions_: functions that are defined on the server-side but called remotely from the browser-side.
To retrieve and mutate data, you can create telefunctions that use SQL or an ORM.

```js
// Node.js server

const { server, context, setSecretKey } = require("telefunc/server");
const Todo = require("./path/to/orm/model/Todo");
const User = require("./path/to/orm/model/User");

server.createTodoItem = async (text) => {
  if (!context.user) {
    // The user is not logged-in; we abort. With Telefunc, permissions
    // are defined programmatically, and you can use the full
    // power of JavaScript to specify permissions.
    return;
  }

  // With an ORM:
  const newTodo = new Todo({ text, authorId: context.user.id });
  await newTodo.save();

  /* With SQL:
  const db = require('your-favorite-sql-query-builder');
  const [newTodo] = await db.query(
    "INSERT INTO todos VALUES (:text, :authorId);",
    {text, authorId: context.user.id}
  );
  */

  return newTodo;
};

// The `context` object is mutable, enabling user authentication:

server.login = async (userEmail, password) => {
  if (!User.verifyCredentials(userEmail, password)) {
    return { wrongCredentials: true };
  }

  const user = await User.findByEmail(userEmail);

  // Telefunc persists `context`. (By using a Cookie saved in the user's browser.)
  context.user = {
    id: user.id,
    name: user.name,
    email: userEmail,
  };
  // Now that `context.user` is set (and persisted), subsequent telefunction calls
  // can use it to get the logged-in user's `id`, `name`, and `email`.
  // Which is what the `createTodoItem` telefunction above does.
};

// Telefunc uses a secret key to create a signature which ensures that the
// context was set by the server. (Otherwise, a user could change the Cookie
// and pretend to be another user.)
setSecretKey("zv!ku1SZi2AiZ*a8!UHIDBAopx(WihowdbwaAb$Pym-o");
```

Features:

- **Authentication**: The context object is mutable allowing you to easily implement authentication.
- **Programmatic Permissions**: Simply define permissions using JavaScript.
- **TypeScript**: Every design decision is made with first-class TypeScript support in mind.
- **SSR**: Out-of-the-box SSR support.
- **Caching**: Telefunction calls are automatically cached with `ETag`.
- **Flexible**: Works with any server framework (Express/Koa/Hapi/Fastify/...), any view library (React/Vue/Angluar/...), any authentication strategy (third-party login with Facebook/Twitter/Google/..., email with password login, email-only password-less login, ...), any third-party API strategy (GraphQL/REST/...).
- **Simple & clear**: Simple design, minimal interface, clear error messages, clear documentation.
- **Robust**: Battle-tested in production at several companies, each release is assailed against a heavy suite of automated tests, bugs are fixed promptly and then unit tested.
- **Responsive**: All GitHub issues are answered, no issue template (just write down your thoughts), bugs are fixed within usually 24 hours.

**Don't see a feature on this list?** Search [GitHub issues](https://github.com/telefunc/telefunc/issues/) if someone has already requested it and upvote it, or open a new issue if not. Roadmap is prioritized based on user feedback.

&nbsp;

> The seamless "drop in and use" nature of Telefunc has enabled Vibescout to accelerate the development of new features, it enables us to quickly prototype new ideas and build out internal dashboards with ease (without the unneeded verbosity of things like GraphQL). The barrier between our server and client is almost nonexistent now- it's really just a function!

<p align="right">
Paul Myburgh, CTO of Vibescout <a href="https://github.com/telefunc/telefunc/issues/22#issuecomment-566983911">(ref)</a>
</p>

&nbsp;

> We are a web shop and decided to try Telefunc with one of our projects. We were delighted: not only made Telefunc our front-end development simpler and faster but it also allowed us to easily implement features that were previously difficult to implement with the rigid structure of REST and GraphQL. We now use it for all our new Node.js projects and we couldn't be happier. The cherry on the cake: it now supports TypeScript which, for us, makes Telefunc a no-brainer.

<p align="right">
Niels Litt <a href="https://github.com/telefunc/telefunc/issues/22#issuecomment-568246660">(ref)</a>
</p>

&nbsp;

## Getting Started

1. Install Telefunc.

   With Express:

   ```js
   const express = require("express");
   // npm install telefunc/server
   const { telefunc } = require("telefunc/server/express");

   const app = express();

   // We install the Telefunc middleware
   app.use(telefunc(setContext));

   // `setContext` is called on every API request. It defines the `context` object.
   // `req` is Express' request object
   async function setContext(req) {
     const context = {};
     // Authentication middlewares usually make user information available at `req.user`.
     context.user = req.user;
     return context;
   }
   ```

   <details>
   <summary>
   With Hapi
   </summary>

   ```js
   const Hapi = require("hapi");
   // npm install telefunc/server
   const { telefunc } = require("telefunc/server/hapi");

   const server = Hapi.Server();

   // We install the Telefunc middleware
   await server.register(telefunc(setContext));

   // `setContext` is called on every API request. It defines the `context` object.
   // `request` is Hapi's request object
   async function setContext(request) {
     const context = {};
     // Authentication plugins usually make user information
     // available at `request.auth.credentials`.
     context.user = request.auth.isAuthenticated
       ? request.auth.credentials
       : null;
     return context;
   }
   ```

   </details>

   <details>
   <summary>
   With Koa
   </summary>

   ```js
   const Koa = require("koa");
   // npm install telefunc/server
   const { telefunc } = require("telefunc/server/koa");

   const app = new Koa();

   // We install the Telefunc middleware
   app.use(telefunc(setContext));

   // `setContext` is called on every API request. It defines the `context` object.
   async function setContext(ctx) {
     const context = {};
     // Authentication middlewares often make user information available at `ctx.state.user`.
     context.user = ctx.state.user;
     return context;
   }
   ```

   </details>

   <details>
   <summary>
   With other server frameworks
   </summary>

   Telefunc provides a `getApiHttpResponse()` function which
   returns the HTTP response of API requests;
   by using `getApiHttpResponse()` you can
   integrate Telefunc with any server framework.
   In fact, the Express/Koa/Hapi middlewares are just tiny wrappers around `getApiHttpResponse()`.

   ```js
   // This is generic pseudo code for how to integrate Telefunc with any server framework.

   // npm install telefunc/server
   const { getApiHttpResponse } = require("telefunc/server");

   // A server framework usually provides a way to add a route and define an HTTP response.
   const { addRoute, HttpResponse } = require("your-favorite-server-framework");

   // Add a new route `/_telefunc/*` to your server
   addRoute(
     "/_telefunc/*",
     // A server framework usually provides an object holding
     // information about the request. We denote this object `req`.
     async ({ req }) => {
       // The context object is available to endpoint functions as `this`.
       const context = {
         user: req.user, // Information about the logged-in user.
       };

       const {
         url, // The HTTP request url (or pathname)
         method, // The HTTP request method (`GET`, `POST`, etc.)
         headers, // The HTTP headers
         body, // The HTTP request body
       } = req;

       const responseProps = await getApiHttpResponse(
         { url, method, headers, body },
         context
       );

       const { body, statusCode, contentType } = responseProps;
       const response = new HttpResponse({ body, statusCode, contentType });
       return response;
     }
   );
   ```

   </details>

2. Define an endpoint function `myFirstEndpoint` in a file called `endpoints.js`.

   ```js
   // Node.js server

   const { server } = require("telefunc/server");

   server.myFirstEndpoint = async function () {
     // The `this` object is the `context` object we defined in `setContext`.
     console.log("The logged-in user is: ", this.user.username);

     return { msg: "Hello, from my first Telefunc endpoint" };
   };
   ```

   > :information_source:
   > Telefunc automatically loads files named `endpoints.js` or `*.endpoints.js`.

3. Use the `telefunc/client` package to remotely call `enpdoint.myFirstEndpoint` from the browser.

   ```js
   // Browser

   // npm install telefunc/client
   import { server } from "telefunc/client";

   (async () => {
     const { msg } = await server.myFirstEndpoint();
     console.log(msg);
   })();
   ```

   <details>
   <summary>
   Without bundler
   </summary>

   ```html
   <script
     crossorigin
     src="https://unpkg.com/telefunc/umd/telefunc-client.min.js"
   ></script>
   <script src="my-script.js"></script>
   <!-- You may or may not need the babel polyfill, depending on whether your `my-script.js`
        arleady includes the babel polyfill -->
   <script
     crossorigin
     src="https://unpkg.com/babel-polyfill/dist/polyfill.min.js"
   ></script>
   ```

   ```js
   // my-script-using-telefunc.js

   (async () => {
     const { msg } = await telefunc.server.myFirstEndpoint();
     console.log(msg);
   })();
   ```

   </details>

That's it.

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## Authentication

Use the context object to authenticate requests. For example:

```js
// Node.js server

const express = require("express");
const { telefunc } = require("telefunc/server/express");

const app = express();

// We install the Telefunc middleware
app.use(telefunc(setContext));

async function setContext(
  // The `req` Express request object.
  req
) {
  const context = {};

  // Express authentication middlewares usually make information
  // about the logged-in user available at `req.user`.
  context.user = req.user;

  // We add login and logout functions to the context object.
  // That way we make them available to our endpoint functions.
  context.login = req.auth.login;
  context.logout = req.auth.logout;

  return context;
}
```

The context object is available to endpoint functions as `this`.

```js
// Node.js server

const { server } = require("telefunc/server");

server.whoAmI = async function () {
  const { user } = this;
  return user.name;
};

server.login = async function (username, password) {
  const user = await this.login(username, password);
  return user;
};

server.logout = async function () {
  await this.logout();
};
```

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## Permissions

With Telefunc,
permissions are defined programmatically.

```js
// Node.js server

server.deletePost = async function () {
  // Only admins are allowed to remove a post
  if (!user.isAdmin) {
    // The user is not an admin — we abort.
    return;
  }

  // ...
};
```

It is crucial to define permissions; never do something like this:

```js
// Node.js server

const db = require("your-favorite-sql-query-builder");

server.executeQuery = async function (query) {
  const result = await db.run(query);
  return result;
};
```

That's a bad idea since anyone can go to your website,
open the browser's web dev console, and call your endpoint.

```js
// Browser

const users = await server.executeQuery("SELECT login, password FROM users;");
users.forEach(({ login, password }) => {
  // W00t I have all passwords ｡^‿^｡
  console.log(login, password);
});
```

Instead, you should define permissions, for example:

```js
// Node.js server

// This endpoint allows a to-do item's text to be modified only by its author.

server.updateTodoText = async function (todoId, newText) {
  // The user is not logged in — we abort.
  if (!this.user) return;

  const todo = await db.getTodo(todoId);
  // There is no to-do item in the database with the ID `todoId` — we abort.
  if (!todo) return;

  // The user is not the author of the to-do item — we abort.
  if (todo.authorId !== this.user.id) return;

  // The user is logged-in and is the author of the todo — we proceed.
  await db.updateTodoText(todoId, newText);
};
```

You may wonder why we return `undefined` when aborting.

```js
// Node.js server

if (!this.user) {
  // Why do we return `undefined`?
  // Why don't we return something like `return {error: 'Permission denied'};`?
  return;
}
```

The reason is simple:
when we develop the frontend we know what is allowed and we can
develop the frontend to always call endpoints in an authorized way;
the `return;` sole goal are to protect our server from unsafe requests and
there is no need to return information.

That said, there are exceptions, for example:

```js
// When the user is not logged in, the frontend redirects the user to the login page.

server.getTodoList = async function () {
  const isLoggedOut = !this.user;
  if (isLoggedOut) {
    // Instead of returning `undefined` we return `{isNotLoggedIn: true}` so that
    // the frontend knows that the user should be redirected to the login page.
    return { isNotLoggedIn: true };
  }
  // ...
};
```

In any case,
as long as you protect your endpoints from unsafe requests,
you can do whatever works for you.

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## Validation

You shouldn't throw exceptions upon validation failures,
instead return an object containing the validation failure reason.

```js
// Node.js server

const { server } = require("telefunc/server");
const isStrongPassword = require("./path/to/isStrongPassword");

server.createAccount = async function ({ email, password }) {
  if (!isStrongPassword(password)) {
    /* Don't deliberately throw exceptions
    throw new Error("Password is too weak.");
    */
    // Return a value instead:
    return { validationError: "Password is too weak." };
  }

  // ..
};
```

## Error Handling

Calling an endpoint throws an error if and only if:

- the browser couldn't connect to the server (`isConnectionError`), or
- the endpoint threw an error or doesn't exist (`isCodeError`).

The client-side thrown error has the properties `isCodeError` and `isConnectionError`
enabling you to handle errors with precision, for example:

```js
// Browser

import { server } from "telefunc/client";

(async () => {
  let data, err;
  try {
    data = await server.getSomeData();
  } catch (_err) {
    err = _err;
  }

  if (err.isCodeError) {
    // The endpoint function threw an uncaught error (there is a bug in your server code)
    alert(
      "Something went wrong on our side. We have been notified and we are working on a fix." +
        "Try again later."
    );
  }
  if (err.isConnectionError) {
    // The browser couldn't connect to the server: the user is offline (or your server is down).
    alert(
      "You don't seem to have an internet connection, try again once you are back online."
    );
  }

  if (err) {
    return { success: false };
  } else {
    return { success: true, data };
  }
})();
```

You can also use [Handli](https://github.com/brillout/handli) which will automatically and gracefully handle errors for you.

```js
// Browser

import "handli"; // npm install handli
// That's it, Telefunc will automatically use Handli.
// Errors are now handled by Handli.
```

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## TypeScript

You can type `server` and `context` using `declare module`:

```ts
!INLINE ../examples/typescript/infra/server.telefunc.ts
```

```ts
!INLINE ../examples/typescript/infra/context.telefunc.ts
```

You can then simply export your telefunctions:

```ts
!INLINE ../examples/typescript/posts/posts.telefunc.ts
```

TypeScript usage examples:

- [/examples/hello-world/](/examples/typescript/)
- [/examples/typescript/](/examples/typescript/)
- [/examples/prisma/](/examples/prisma/)

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## API Documentation

API browsing tools such as OpenAPI (formerly known as Swagger) makes sense for an API that is meant to be used by third-party developers who don't have access to your source code.

A Telefunc is meant to be used by your own developers;
instead of using OpenAPI,
you can give your frontend developers access to your backend code and save all endpoints in files named `endpoints.js`.
That way, a frontend developer can explore your API.

For improved developer experience,
you can use [Telefunc with TypeScript](#typescript) to make type hints available on the frontend.
A frontend developer can then explore your Telefunc directly in his IDE!

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## Caching

Telefunc automatically caches your endpoint results by using the HTTP ETag header.
You can disable caching by using the [`disableCache` option](#disablecache).

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## SSR

The Telefunc client is isomorphic (aka universal) and works in the browser as well as in Node.js.

SSR works out of the box.

!INLINE ./snippets/section-footer.md #readme --hide-source-path

## Options

All options with their default value:

```js
// Browser (or Node.js)

import { config } from "telefunc/client";

// The URL of the Node.js server that serves the API
config.serverUrl = null;

// The base URL of Telefunc HTTP requests
config.baseUrl = "/_telefunc/";

// Whether the endpoint arguments are always passed in the HTTP body
config.shortUrl = false;
```

```js
// Node.js

import { config } from "telefunc/server";

// Whether Telefunc generates an ETag header.
config.disableCache = false;

// The base URL of Telefunc HTTP requests
config.baseUrl = "/_telefunc/";
```

- [`serverUrl`](#serverurl)
- [`baseUrl`](#baseUrl)
- [`shortUrl`](#shorturl)
- [`disableCache`](#disablecache)

<br/>

### `serverUrl`

You usually don't need to provide any `serverUrl`.
But if your API and your browser-side assets are not served by the same server,
then you need to provide a `serverUrl`.

`serverUrl` can be one of the following:

- `null`. (Default value.)
- The URL of the server, for example `http://localhost:3333/api` or `https://api.example.org`.
- The IP address of the server, for example `92.194.249.32`.

When `serverUrl` is `null`, the Telefunc client uses `window.location.origin` as server URL.

```js
import { server, config } from "telefunc/client";
import assert from "assert";

config.serverUrl = "https://api.example.com:1337";

callEndpoint();

async function callEndpoint() {
  await server.myEndpoint();

  assert(window.location.origin === "https://example.com");
  // Normally, Telefunc would make an HTTP request to the same origin:
  //   POST https://example.com/_telefunc/myEndpoint HTTP/1.1

  // But because we have set `serverUrl`, Telefunc makes
  // the HTTP request to `https://api.example.com:1337` instead:
  //   POST https://api.example.com:1337/_telefunc/myEndpoint HTTP/1.1
}
```

<br/>

### `baseUrl`

By default, the pathname of any HTTP request that Telefunc makes starts with `/_willdcard_api/`.
You can change this base URL by using the `baseUrl` option.

```js
import { server, config } from "telefunc/client";
import assert from "assert";

config.baseUrl = "/_my_custom_api_base_url/";

callEndpoint();

async function callEndpoint() {
  await server.myEndpoint();

  assert(window.location.origin === "https://example.com");
  // Normally, Telefunc would make an HTTP request to `/_telefunc/`:
  //   POST https://example.com/_telefunc/myEndpoint HTTP/1.1

  // But because we have changed `baseUrl`, Telefunc makes
  // the HTTP request to `/_my_custom_api_base_url/` instead:
  //   POST https://example.com/_my_custom_api_base_url/myEndpoint HTTP/1.1
}
```

If you change the `baseUrl` option of your Telefunc client,
then make sure that the `baseUrl` of your Telefunc server is the same:

```js
import { config } from "telefunc/server";

config.baseUrl = "/_my_custom_api_base_url/";
```

<br/>

### `shortUrl`

The `shortUrl` option is about configuring whether
arguments are always passed in the HTTP request body.
(Instead of being passed in the HTTP request URL.)

```js
import { server, config } from "telefunc/client";

config.shortUrl = true; // Default value is `false`

callEndpoint();

async function callEndpoint() {
  await server.myEndpoint({ some: "arguments" }, "second arg");

  // Normally, Telefunc would pass the arguments in the HTTP request URL:
  //   POST /_telefunc/myEndpoint/[{"some":"arguments"},"second arg"] HTTP/1.1

  // But because we have set `shortUrl` to `true`,
  // Telefunc passes the arguments in the HTTP request body instead:
  //   POST /_telefunc/myEndpoint HTTP/1.1
  //   Request payload: [{"some":"arguments"},"second arg"]
}
```

<br/>

### `disableCache`

By default Telefunc generates an HTTP ETag cache header.
If you need to save CPU computation time,
you can set `disableCache` to `true` and Telefunc will skip generating HTTP ETag headers.

```js
import telefuncServer from "telefunc/server";

telefuncServer.disableCache = true;
```

!INLINE ./snippets/section-footer.md #readme --hide-source-path
