<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/reframejs/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=80 alt="Wildcard API"/>
  </a>
</p>

<p align="center">Functions as an API.</p>

<br/>

A (simplistic) todo app built with:
 - React
 - Wildcard API
 - Node.js
 - SQLite

> You can also play around with Wildcard by using
> [Reframe's react-sql starter](https://github.com/reframejs/reframe/tree/master/plugins/create/starters/react-sql#readme)
> which includes a Wildcard API.

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

[Open a ticket](https://github.com/reframejs/wildcard-api/issues/new) or [chat with us](https://discord.gg/kqXf65G)
if you want to ask questions, request features, or if you just want to talk to us.

<b><sub><a href="#contents">&#8679; TOP &#8679;</a></sub></b>

<br/>
<br/>


## Code Highlights

This section highlights the interesting parts of the example.

### View Endpoints

(With *view endpoint* we denote an endpoint that retrieves data.)

~~~js
// /example/api/view-endpoints

const {endpoints} = require('wildcard-api');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// Our view endpoints are tailored to the frontend. For example, the endpoint
// `getLandingPageData` returns exactly and only the data needed by the landing page

endpoints.getLandingPageData = async function () {
  // `this` holds request information such as HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = false;`,
    {authorId: user.id}
  );

  // The landing page displays user information, so we return `user`
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


<br/>

[Open a ticket](https://github.com/reframejs/wildcard-api/issues/new) or [chat with us](https://discord.gg/kqXf65G)
if you want to ask questions, request features, or if you just want to talk to us.

<b><sub><a href="#contents">&#8679; TOP &#8679;</a></sub></b>

<br/>
<br/>

### Server Integration

With Express:

~~~js
// /example/start-with-express

const express = require('express');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = express();

app.all('/wildcard/*' , (req, res) => {
  // Our request object `req` is available to endpoint functions over `this`.
  // That is `this===req`. For example:
  // `endpoints.getUser = function() { return getLoggedUser(this.headers.cookies) }`.
  getApiResponse(req)
  .then(apiResponse => {
    res.status(apiResponse.statusCode);
    res.type(apiResponse.type);
    res.send(apiResponse.body);
  })
});

// Serve our frontend
app.use(express.static('client/dist', {extensions: ['html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
~~~

<details>
<summary>
With Hapi
</summary>

~~~js
// /example/start-with-hapi

const Hapi = require('hapi');
const Inert = require('inert');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

startServer();

async function startServer() {
  const server = Hapi.Server({
    port: 3000,
    debug: {request: ['internal']},
  });

  server.route({
    method: '*',
    path: '/wildcard/{param*}',
    handler: async (request, h) => {
      const apiResponse = await getApiResponse(request.raw.req);
      const resp = h.response(apiResponse.body);
      resp.code(apiResponse.statusCode);
      resp.type(apiResponse.type);
      return resp;
    },
  });

  await server.register(Inert);
  server.route({
    method: '*',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'client/dist',
      }
    }
  });

  await server.start();

  console.log('Server is running. Go to http://localhost:3000')
}
~~~
</details>

<details>
<summary>
With Koa
</summary>

~~~js
// /example/start-with-koa

const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = new Koa();

const router = new Router();

router.all('/wildcard/*', async ctx => {
  const apiResponse = await getApiResponse(ctx);
  ctx.status = apiResponse.statusCode;
  ctx.type = apiResponse.type;
  ctx.body = apiResponse.body;
});

app.use(router.routes());

app.use(Static('client/dist', {extensions: ['.html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
~~~
</details>



<br/>

[Open a ticket](https://github.com/reframejs/wildcard-api/issues/new) or [chat with us](https://discord.gg/kqXf65G)
if you want to ask questions, request features, or if you just want to talk to us.

<b><sub><a href="#contents">&#8679; TOP &#8679;</a></sub></b>

<br/>
<br/>

### Mutation Endpoints

(With *mutation endpoint* we denote an endpoint that mutates data.)

~~~js
// /example/api/mutation-endpoints

const {endpoints} = require('wildcard-api');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// We tailor mutation endpoints to the frontend as well

endpoints.toggleComplete = async function(todoId) {
  const user = await getLoggedUser(this.headers.cookie);
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

[Open a ticket](https://github.com/reframejs/wildcard-api/issues/new) or [chat with us](https://discord.gg/kqXf65G)
if you want to ask questions, request features, or if you just want to talk to us.

<b><sub><a href="#contents">&#8679; TOP &#8679;</a></sub></b>

<br/>
<br/>

### React Frontend

The following code shows how our frontend
uses our Wildcard API to retrieve the user information,
the user todos,
and to update a todo.

~~~js
// /example/client/LandingPage

import React from 'react';
import {endpoints} from 'wildcard-api/client';
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
// /example/client/Todo

import React from 'react';
import {endpoints} from 'wildcard-api/client';
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

[Open a ticket](https://github.com/reframejs/wildcard-api/issues/new) or [chat with us](https://discord.gg/kqXf65G)
if you want to ask questions, request features, or if you just want to talk to us.

<b><sub><a href="#contents">&#8679; TOP &#8679;</a></sub></b>

<br/>
<br/>

<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/example.template.md` instead.






-->
