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

Wildcard has two goals:
 1. Provide a small JavaScript library to make the creation of a custom API super easy.
 2. Debunk the common misconception that a generic API (REST/GraphQL) is a silver bullet.
    A generic API is great for third party clients and large applications
    but is an unecessary burden for rapid prototyping and medium-sized applications.

With Wildcard,
creating an endpoint is as easy as creating a JavaScript function:

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
It simply makes a function defined on the server "callable" in the browser.
(Behind the curtain Wildcard makes an HTTP request.)
How you retrieve and mutate data is up to you.
You can use SQL, ORM, NoSQL, etc.

#### Contents

 - [Why Wildcard](#why-wildcard)
 - [Example](#example)
 - [Quick Start](#getting-started)


<br/>

### Why Wildcard

Wildcard is about making
retrieving (and mutating) data from the frontend a seamless experience:
No schema,
no permission rules,
just create functions on `endpoints`.

These endpoint functions effectively act as "permission holes".
This is a simple alternative to otherwise complex permissions mechanisms.

To make the experience further seamless,
Wildcard provides:
 - Automatic error handling (optional).
   <br/>
   Failures, such as when the user looses his internet connection, are automatically handled for you.
   <br/>
   Using [Handli](https://github.com/brillout/handli).
 - Extended serialization.
   <br/>
   Using [JSON-S](https://github.com/brillout/json-s) instead of JSON to support further JavaScript types.
   (Such as `Date` which JSON doesn't support.)
 - Universal/Isomorphic/SSR support.
   <br/>
   The Wildcard client works in the browser as well as on Node.js and
   SSR is supported in a seamless way.
   (SSR is an increasingly common approach to render (React/Vue/Angular) views on the server.)

Wildcard is an ideal tool for rapid protoyping:
Write the couple of data queries (SQL/ORM/NoSQL) your prototype needs,
wrap them in endpoint functions,
and you're good to go.

That said, a custom API (and thus Wildcard) is not suitable for:
 - Third party clients. (A generic API is inherently required.)
 - Large applications with a frontend development decoupled from backend development.

Wildcard (and any custom API) works best with a tight frontend-backend development.

At [Usage Manual - Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api)
we further explore the different uses cases for custom APIs.


<br/>

## Example

Let's look at a Wildcard API for a simple todo app:

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

endpoints.toggleComplete = async function(todoId) {
  const user = await getLoggedUser(this.headers.cookie);
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

Instead of tailored endpoints, we could
create generic endpoints, such as:

~~~js
const {endpoints} = require('wildcard-api');
const db = require('../db');
const {getLoggedUser} = require('../auth');

endpoints.getUser = async function() {
  const user = await getLoggedUser(this.headers.cookie);
  return user;
};

endpoints.getTodos = async function(completed) {
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return;

  if( ![true, false].includes(completed) ) return;

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = :completed;`,
    {authorId: user.id, completed}
  );

  return todos;
};
~~~

But we deliberately choose a tailored API over a generic API.
The benefits of a tailored API are explained at
[Usage Manual - Tailored Aproach](/docs/usage-manual.md#tailored-approach).

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
    const apiResponse = await getApiResponse({method, url, headers});

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

The example's code,
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
