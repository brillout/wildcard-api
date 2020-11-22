<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="/docs/images/logo-title.svg" height="105" alt="Wildcard API"/>
  </a>
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
   $ git clone git@github.com:telefunc/telefunc
   ~~~

1. Install dependencies.

   First the dependencies of Wildcard:
   ~~~shell
   $ yarn
   ~~~

   Then the dependencies of the example:
   ~~~shell
   $ cd example/todo-list/
   $ yarn
   ~~~

2. Build the frontend.

   ~~~shell
   $ yarn start:build
   ~~~

3. Run the server.

   ~~~shell
   $ npm run start:server
   ~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
// ./api/view.endpoints.js

const { server } = require("telefunc/server");
const db = require("../db");
const { getLoggedUser } = require("../auth");

// Our view endpoints are tailored to the frontend. For example, the endpoint
// `getLandingPageData` returns exactly and only the data needed by the landing page

server.getLandingPageData = async function () {
  // `this` holds request information such as HTTP headers
  const user = await getLoggedUser(this.headers);
  if (!user) return { userIsNotLoggedIn: true };

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = false;`,
    { authorId: user.id }
  );

  // The landing page displays user information, so we return `user`
  return { user, todos };
};

server.getCompletedPageData = async function () {
  const user = await getLoggedUser(this.headers);
  if (!user) return { userIsNotLoggedIn: true };

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = true;`,
    { authorId: user.id }
  );

  // We don't return `user` as the page doesn't need it
  return { todos };
};
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
// ./start-with-express

const express = require("express");
const { wildcard } = require("telefunc/server/express");

const app = express();

// Server our API endpoints
app.use(
  wildcard(async (req) => {
    const { headers } = req;
    const context = { headers };
    return context;
  })
);

// Serve our frontend
app.use(express.static("client/dist", { extensions: ["html"] }));

app.listen(3000);

console.log("Express server is running, go to http://localhost:3000");
~~~

<details>
<summary>
With Hapi
</summary>

~~~js
// ./start-with-hapi

const Hapi = require("hapi");
const Inert = require("@hapi/inert");
const { wildcard } = require("telefunc/server/hapi");

startServer();

async function startServer() {
  const server = Hapi.Server({
    port: 3000,
    debug: { request: ["internal"] },
  });

  await server.register(
    wildcard(async (request) => {
      const { headers } = request;
      const context = { headers };
      return context;
    })
  );

  await server.register(Inert);
  server.route({
    method: "*",
    path: "/{param*}",
    handler: {
      directory: {
        path: "client/dist",
        defaultExtension: "html",
      },
    },
  });

  await server.start();

  console.log("Hapi server is running, go to http://localhost:3000");
}
~~~
</details>

<details>
<summary>
With Koa
</summary>

~~~js
// ./start-with-koa

const Koa = require("koa");
const Static = require("koa-static");
const { wildcard } = require("telefunc/server/koa");

const app = new Koa();

// Serve our Wilcard API
app.use(
  wildcard(async (ctx) => {
    const { headers } = ctx.request;
    const context = { headers };
    return context;
  })
);

// Serve our frontend
app.use(Static("client/dist", { extensions: [".html"] }));

app.listen(3000);

console.log("Koa server is running, go to http://localhost:3000");
~~~
</details>



<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
// ./api/mutation.endpoints.js

const { server } = require("telefunc/server");
const db = require("../db");
const { getLoggedUser } = require("../auth");

// We tailor mutation endpoints to the frontend as well

server.toggleComplete = async function (todoId) {
  const user = await getLoggedUser(this.headers);
  // Do nothing if user is not logged in
  if (!user) return;

  const todo = await getTodo(todoId);
  // Do nothing if todo not found.
  // (This can happen since `toggleComplete` is essentially public and anyone
  // on the internet can "call" it with an arbitrary `todoId`.)
  if (!todo) return;

  // Do nothing if the user is not the author of the todo
  if (todo.authorId !== user.id) return;

  const completed = !todo.completed;
  await db.query(
    "UPDATE todos SET completed = :completed WHERE id = :todoId;",
    { completed, todoId }
  );

  return completed;
};

async function getTodo(todoId) {
  const [todo] = await db.query(`SELECT * FROM todos WHERE id = :todoId;`, {
    todoId,
  });
  return todo;
}
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
// ./client/LandingPage

import "./common";
import React from "react";
import { server } from "telefunc/client";
import renderPage from "./renderPage";
import LoadingWrapper from "./LoadingWrapper";
import Todo from "./Todo";

renderPage(<LandingPage />);

function LandingPage() {
  // We use our Wildcard endpoint to get user information and the user's todos
  const fetchData = async () => await server.getLandingPageData();

  return (
    <LoadingWrapper fetchData={fetchData}>
      {({
        data: {
          todos,
          user: { username },
        },
        updateTodo,
      }) => (
        <div>
          Hi, {username}.
          <br />
          <br />
          Your todos are:
          <div>
            {todos.map((todo) => (
              <Todo todo={todo} updateTodo={updateTodo} key={todo.id} />
            ))}
          </div>
          <br />
          Your completed todos: <a href="/completed">/completed</a>.
        </div>
      )}
    </LoadingWrapper>
  );
}
~~~

~~~js
// ./client/Todo

import React from "react";
import { server } from "telefunc/client";
import { TodoCheckbox, TodoText } from "./TodoComponents";

export default Todo;

function Todo({ todo, updateTodo }) {
  return (
    <div>
      <TodoCheckbox todo={todo} onChange={onCompleteToggle} />
      <TodoText todo={todo} />
    </div>
  );

  async function onCompleteToggle() {
    const completed = await server.toggleComplete(todo.id);
    updateTodo(todo, { completed });
  }
}
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/examples/todo-list/readme.template.md` and run `npm run docs` (or `yarn docs`).






-->
