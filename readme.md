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
    <img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=90 alt="Wildcard API"/>
  </a>
</p>
<p align='center'><a href="/../../#readme"><b>Intro</b></a> &nbsp; | &nbsp; <a href="/docs/usage-manual.md#readme">Usage Manual</a></p>
&nbsp;

Goals:
 1. JavaScript library to make the creation of a custom API super easy.
 2. Debunk the common misconception that a generic API (REST/GraphQL) is a silver bullet.
    A generic API is great for third party clients and large applications
    but is an unecessary burden for rapid prototyping and medium-sized applications.

With Wildcard,
creating an API endpoint is as easy as creating a JavaScript function:

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

That's the only thing Wildcard does:
It makes functions defined on the server "callable" in the browser.
That's it.
Wildcard takes care of HTTP requests and serialization.
How you retrieve/mutate data is up to you.
You can use SQL, an ORM, NoSQL, etc.

#### Contents

 - [Why Wildcard](#why-wildcard)
 - [Example](#example)
 - [Quick Start](#getting-started)


<br/>

### Why Wildcard

Wildcard makes
retrieving/mutating data from the frontend a seamless experience:
No schema,
no permission rules,
just create functions on `endpoints`.

These endpoint functions effectively act as "permission holes".
This is a simple alternative to otherwise complex permissions mechanisms.

To make the experience further seamless,
Wildcard provides:
 - Automatic error handling (optional).
   <br/>
   Using [Handli](https://github.com/brillout/handli) to handle network corner cases
   such as when the user looses his internet connection.
 - Extended serialization.
   <br/>
   Using [JSON-S](https://github.com/brillout/json-s) to support further JavaScript types.
   (Such as `Date` which JSON doesn't support.)
 - Universal/Isomorphic/SSR support.
   <br/>
   The Wildcard client works in the browser as well as on Node.js with seamless support for
   server-side rendering.

Wildcard is an ideal tool for rapid protoyping:
Write the couple of data queries (SQL/ORM/NoSQL) your prototype needs,
wrap them in endpoint functions,
and you're good to go.

That said, a custom API (and thus Wildcard) is not suitable for:
 - Third party clients. (A generic API is inherently required.)
 - Large applications with a frontend development decoupled from API development.

At [Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api)
we explore custom API use cases.


<br/>

## Example

A Wildcard API for a simple todo app:

~~~js
const {endpoints} = require('wildcard-api');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// Our view endpoints are tailored to the frontend. For example, the endpoint
// `getLandingPageData` returns exactly and only the data needed by the landing page

endpoints.getLandingPageData = async function () {
  // `this` holds contextual information such as HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = false;`,
    {authorId: user.id}
  );

  // We return `user` as the landing page displays user information.
  return {user, todos};
};

endpoints.getCompletedPageData = async function () {
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = true;`,
    {authorId: user.id}
  );

  // We don't return `user` as the page doesn't need it
  return {todos};
};
~~~
~~~js
const {endpoints} = require('wildcard-api');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// We make mutation endpoints tailored to the frontend as well

endpoints.toggleComplete = async function(todoId) {
  const user = await getLoggedUser(this.headers.cookie);
  // Do nothing if user is not logged in
  if( !user ) return;

  const todo = await getTodo(todoId);
  // Do nothing if no todo found with id `todoId`
  if( !todo ) return;

  // Do nothing if the user is not the author of the todo
  if( todo.authorId !== user.id ) return;

  const completed = !todo.completed;
  await db.query(
    "UPDATE todos SET completed = :completed WHERE id = :todoId;",
    {completed, todoId}
  );

  return completed;
};

async function getTodo(todoId) {
  const [todo] = await db.query(
    `SELECT * FROM todos WHERE id = :todoId;`,
    {todoId}
  );
  return todo;
}
~~~

We deliberately choose to implement tailored endpoints over generic ones.
We explain why at
[Tailored Aproach](/docs/usage-manual.md#tailored-approach).

Wildcard can be used with any server framework such as Express, Hapi, Koa, etc.
In our example we use Express:

~~~js
const express = require('express');
const {getApiResponse} = require('wildcard-api');
require('./api');

start();

async function start() {
  const app = express();

  app.all('/wildcard/*' , async(req, res, next) => {
    const {method, url, headers} = req;

    // `context` is made available to endpoint functions over `this`
    // E.g. `endpoints.getUser = function() { return getLoggedUser(this.headers) }`
    const context = {method, url, headers};
    const apiResponse = await getApiResponse(context);

    if( apiResponse ) {
      res.status(apiResponse.statusCode);
      res.send(apiResponse.body);
    }

    next();
  });

  app.use(express.static('client/dist', {extensions: ['html']}));

  app.listen(3000);
}
~~~

The example's entire code,
including a React frontend,
is at
[./example](/example/).

<br/>

## Quick Start

Work-in-progress.

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
