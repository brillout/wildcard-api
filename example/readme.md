<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="/docs/images/logo-title.svg" height="105" alt="Wildcard API"/>
  </a>
</p>

<p align="center">
  <sup>
    <a href="#top">
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
    &nbsp;&nbsp;&nbsp;&nbsp;
    &nbsp;&nbsp;&nbsp;&nbsp;
    &nbsp;&nbsp;
    <a href="https://github.com/reframejs/wildcard-api/issues/new?title=I'd%20like%20to%20join&body=I'd%20like%20to%20contribute%2C%20how%20can%20I%20help%3F">
      <img
        src="/docs/images/biceps.svg"
        width="16"
        align="middle"
      />
      Co-maintain Wildcard
    </a>
  </sup>
</p>
&nbsp;

# Example - A Todo List

A (simplistic) todo app built with:
 - React
 - Wildcard API
 - Node.js
 - SQLite

#### Contents

- [Run the Example](#run-the-example)
- [Code Highlights](#code-highlights)
  - [View Endpoints](#view-endpoints)
  - [Server Integration](#server-integration)
  - [Mutation Endpoints](#mutation-endpoints)
  - [React Frontend](#react-frontend)

## Run the Example

Run the following npm scripts to build and serve the example:

0. Get the code.

   ~~~shell
   $ git clone git@github.com:reframejs/wildcard-api
   $ cd example/
   ~~~

1. Install dependencies.

   ~~~shell
   $ npm run setup
   ~~~

2. Build the frontend.

   ~~~shell
   $ npm run build
   ~~~

3. Run the server.

   ~~~shell
   $ npm run server
   ~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>


## Code Highlights

This section highlights the interesting parts of the example.

### View Endpoints

(With *view endpoint* we denote an endpoint that retrieves data.)

~~~js
// ../example/api/view.endpoints.js

const {endpoints} = require('@wildcard-api/server');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// Our view endpoints are tailored to the frontend. For example, the endpoint
// `getLandingPageData` returns exactly and only the data needed by the landing page

endpoints.getLandingPageData = async function () {
  // `this` holds request information such as HTTP headers
  const user = await getLoggedUser(this.headers);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = false;`,
    {authorId: user.id}
  );

  // The landing page displays user information, so we return `user`
  return {user, todos};
};

endpoints.getCompletedPageData = async function () {
  const user = await getLoggedUser(this.headers);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = true;`,
    {authorId: user.id}
  );

  // We don't return `user` as the page doesn't need it
  return {todos};
};
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>

### Server Integration

With Express:

~~~js
// ../example/start-with-express

const express = require('express');
const wildcard = require('@wildcard-api/server/express');

const app = express();

// Server our API endpoints
app.use(wildcard(async req => {
  const {headers} = req;
  const context = {headers};
  return context;
}));

// Serve our frontend
app.use(express.static('client/dist', {extensions: ['html']}));

app.listen(3000);

console.log('Express server is running, go to http://localhost:3000')
~~~

<details>
<summary>
With Hapi
</summary>

~~~js
// ../example/start-with-hapi

const assert = require('@brillout/assert');
const Hapi = require('hapi');
const Inert = require('@hapi/inert');
const wildcard = require('@wildcard-api/server/hapi');

startServer();

async function startServer() {
  const server = Hapi.Server({
    port: 3000,
    debug: {request: ['internal']},
  });

  await server.register(wildcard(async request => {
    const {headers} = request;
    const context = {headers};
    return context;
  }));

  await server.register(Inert);
  server.route({
    method: '*',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'client/dist',
        defaultExtension: 'html',
      }
    }
  });

  await server.start();

  console.log('Hapi server is running, go to http://localhost:3000')
}
~~~
</details>

<details>
<summary>
With Koa
</summary>

~~~js
// ../example/start-with-koa

const Koa = require('koa');
const Static = require('koa-static');
const wildcard = require('@wildcard-api/server/koa');

const app = new Koa();

// Server our API endpoints
app.use(wildcard(async ctx => {
  const {headers} = ctx.request;
  const context = {headers};
  return context;
}));

// Serve our frontend
app.use(Static('client/dist', {extensions: ['.html']}));

app.listen(3000);

console.log('Koa server is running, go to http://localhost:3000')
~~~
</details>



<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>

### Mutation Endpoints

(With *mutation endpoint* we denote an endpoint that mutates data.)

~~~js
// ../example/api/mutation.endpoints.js

const {endpoints} = require('@wildcard-api/server');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// We tailor mutation endpoints to the frontend as well

endpoints.toggleComplete = async function(todoId) {
  const user = await getLoggedUser(this.headers);
  // Do nothing if user is not logged in
  if( !user ) return;

  const todo = await getTodo(todoId);
  // Do nothing if todo not found.
  // (This can happen since `toggleComplete` is essentially public and anyone
  // on the internet can "call" it with an arbitrary `todoId`.)
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


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>

### React Frontend

The following code shows how our frontend
uses our Wildcard API to retrieve the user information,
the user todos,
and to update a todo.

~~~js
// ../example/client/LandingPage

import './common';
import React from 'react';
import {endpoints} from '@wildcard-api/client';
import renderPage from './renderPage';
import LoadingWrapper from './LoadingWrapper';
import Todo from './Todo';

renderPage(<LandingPage/>);

function LandingPage() {
  // We use our Wildcard endpoint to get user information and the user's todos
  const fetchData = async () => await endpoints.getLandingPageData();

  return (
    <LoadingWrapper fetchData={fetchData}>{
      ({data: {todos, user: {username}}, updateTodo}) => (
        <div>
          Hi, {username}.
          <br/><br/>
          Your todos are:
          <div>
            {todos.map(todo =>
              <Todo todo={todo} updateTodo={updateTodo} key={todo.id}/>
            )}
          </div>
          <br/>
          Your completed todos: <a href="/completed">/completed</a>.
        </div>
      )
    }</LoadingWrapper>
  );
}
~~~

~~~js
// ../example/client/Todo

import React from 'react';
import {endpoints} from '@wildcard-api/client';
import {TodoCheckbox, TodoText} from './TodoComponents';

export default Todo;

function Todo({todo, updateTodo}) {
    return (
      <div>
        <TodoCheckbox todo={todo} onChange={onCompleteToggle}/>
        <TodoText todo={todo}/>
      </div>
    );

    async function onCompleteToggle() {
      const completed = await endpoints.toggleComplete(todo.id);
      updateTodo(todo, {completed});
    }
}
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>

<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/example.template.md` and run `npm run docs` (or `yarn docs`).






-->
