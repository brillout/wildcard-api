<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/reframejs/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=106 alt="Wildcard API"/>
  </a>
</p>
&nbsp;

# RPC vs REST/GraphQL

This document explains: (a) what RPC is; and (b) how RPC compares to REST/GraphQL.

> :heavy_check_mark:
> After reading this document,
> you will be able to choose the right tool for the job:
> you will know in what situations whether RPC or REST/GraphQL is best.

- [What is RPC](#what-is-rpc)
- [Schema vs Schemaless](#schema-vs-schemaless)
- [Case Studies](#case-studies)
- [Conclusion](#conclusion)

<br/>

## What is RPC

The [Wikipedia article](https://en.wikipedia.org/wiki/Remote_procedure_call) explains RPC well:

> [...] A remote procedure call (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

For example:

~~~js
// Node.js server

// We use Wildcard to create an RPC API
const {endpoints} = require('wildcard-api');

// We define a function (aka procedure) `hello` on a Node.js server.
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  // We call `hello` remotely from the browser.
  const {message} = await endpoints.hello('Elisabeth');
  console.log(message); // Prints `Welcome Elisabeth`
})();
~~~

What we are doing here is RPC:
our function `hello` is executed on the Node.js server but called remotely in the browser.

In the context of web development,
RPC is usually used to call SQL/ORM queries in order to retrieve/mutate data.
For example:

~~~js
// Node.js server

const endpoints = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  const user = await getLoggedUser(this.headers); // We explain `this` in Wildcard's docs.

  if( !user ) {
    // The user is not logged-in.
    // We abort.
    // (This is basically how you define permissions with RPC
    // which we will talk more about in Wildcard's docs.)
    return;
  }

  // With an ORM/ODM:
  const newTodo = new Todo({text, authorId: user.id});
  await newTodo.save();
  /* Or with SQL:
  const db = require('your-favorite-sql-query-builder');
  const [newTodo] = await db.query(
    "INSERT INTO todos VALUES (:text, :authorId);",
    {text, authorId: user.id}
  );
  */

  return newTodo;
};
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Schema vs Schemaless

The fundamental difference between RPC and REST/GraphQL is that RPC is schemaless whereas REST/GraphQL has a schema.

Let's for example consider a todo list.

A RESTful API of a todo list app would have a schema and queries like this:
- `HTTP GET /todos` to list all todo items.
- `HTTP POST /todos` to create a new todo item.
- `HTTP GET /todos/{id}` to read a todo item with the id `{id}`.
- `HTTP PUT /todos/{id}` to update a todo item with the id `{id}`.
- `HTTP DELETE /todos/{id}` to delete to delete a todo item with the id `{id}`.

The frontend uses these schema queries to retrieve/mutate todo items.
For example:

~~~js
// Browser

export default fetchTodos();

// We get the list of todos by using the schema query `HTTP GET /todos`.

async function fetchTodos() {
  const response = await window.fetch('/api/todos', {method: 'GET'});
  const todos = await response.json();
  return todos;
};
~~~
~~~js
// Browser

import React from 'react';
import fetchTodos from './fetchTodos.js'
import fetchData from './react-hooks/fetchData.js';

// We use our `fetchTodos` function and React to render our todo list.

export default TodoList;

function TodoList() {
  const todos = fetchData(fetchTodos);

  if( !todos ) return <div>Loading...</div>;

  return (
    <div>
      <p>My Todo List:</p>
      <ul>{
        todos.map(todo =>
          <li key={todo.id}>{todo.text}</li>
        )
      }</ul>
    </div>
  );
}
~~~

The important thing to note here is that the frontend doesn't directly use SQL/ORM queries.
Instead it is the RESTful API that runs SQL/ORM queries on behalf of the frontend.

From the perspective of the frontend, the schema and its queries are all there is:
the database and SQL/ORM queries are hidden by the schema.
A frontend developer doesn't even have to know whether the database is MongoDB or PostgreSQL.

This is the raison d'être and the fundamental purpose of a schema.

> :bulb: The schema abstracts the database away.

To a Software Architect,
who is (rightfully) crucially concerned about keeping the Software Architecture as simple as possbile,
question arises &mdash; what is the added benefit of using a schema? What is the justification of adding an extra layer of abstraction? Is a schema absolutely required or can we get rid of it?

Before we delve into the benefits and drawbacks of having a schema,
let's have a look at the same example but implemented with RPC:

~~~js
// Node.js server

const db = require('your-favorite-sql-query-builder');
const {endpoints} = require('wildcard-api');

// We implement a `getTodos` function on the server that
// runs a SQL query in order to get the todo items.

endpoints.getTodos = async function() {
  const todos = await db.query("SELECT id, text FROM todos;");
  return todos;
};
~~~
~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

export default fetchTodos();

// We get the list of todos by (remotely) calling `getTodos`.

async function fetchTodos() {
  const todos = await endpoints.getTodos();
  return todos;
};
~~~

This example doesn't use a schema;
instead, we use functions that directly use SQL/ORM queries.
In other words, we use SQL/ORM queries while developing the frontend.
This is the opposite of our previous example where the REST schema abstracts away the database.

> :bulb: RPC is schemaless: a frontend developer directly writes and uses SQL/ORM queries to retrieve and mutate data.

This is, as mentioned in the beginning of this section, the fundamental difference between RPC and REST/GraphQL:
with RPC the frontend uses SQL/ORM queries directly
whereas REST/GraphQL's schema
abstracts the database away.

The question whether to use RPC or REST/GraphQL boils down to the following question: is a schema required?
We now explore the benefits and drawbacks of using a schema.

**SQL/ORM is powerful**

A benefit of RPC's schemaless approach is
that SQL/ORM queries are more powerful than schema queries. For example:

~~~js
// Node.js server

const db = require('your-favorite-sql-query-builder');
const {endpoints} = require('wildcard-api');

// Let's imagine the frontend adds a new button that when clicked
// sets all todo items as completed.

endpoints.setAllTodosAsCompleted = async function() {
  await db.query('UPDATE todos SET is_completed = TRUE;');
};
~~~
~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

export default markAllCompleted;

async function markAllCompleted() {
  await endpoints.setAllTodosAsCompleted();
};
~~~

Achieving the same using a schema is a clunky experience:

~~~js
// Browser

export default markAllCompleted;

// We use the schema operation `HTTP PUT /todos/{id}` to set each todo

async function markAllCompleted() {
  const response = await window.fetch('/todos', {method: 'GET'});
  const todos = await response.json();

  await Promise.all(todos.map(async todo => {
    // We have to make an HTTP request for each todo item. This is inefficient.
    await window.fetch('/todos/'+todo.id, {method: 'PUT', body: {id, is_completed: true}});
  });
};
~~~

A schema can stand in the way of retrieving/mutating data
and can make things more difficult and sometimes not even possible.

SQL/ORM queries are vastly more powerful;
the schema cripples the power of SQL / your ORM.

> :information_source: **GraphQL's power**
> <br/>
> GraphQL is more powerful than REST and improves the situation. But only to a certain degree &mdash; SQL/ORM queries
> are still vastly more powerful than GraphQL queries.


**Schemaless is simple**

RPC is simple:
there is no schema to define and no CRUD resolvers to write.

Instead, we simply define functions on our server and remotely call them in the browser.
Which allows, while developing the frontend,
to use any server-side tool we want to retrieve/mutate data,
such as SQL queries or an ORM.
(We have to be [careful about permissions](/../../#permissions) though.)


**A schema decouples**

If RPC is simpler and SQL/ORM queries more powerful,
what is the benefit of using a schema and REST/GraphQL?
The answer is that it decouples the frontend from the backend.

Let's imagine we want to change the frontend of our previous example
to only show non-completed todo items.
For that we need to change our SQL query:

~~~diff
  // Node.js server

  const db = require('your-favorite-sql-query-builder');
  const {endpoints} = require('wildcard-api');

  endpoints.getAllTodos = async function({text}) {
-   const todos = await db.query("SELECT id, text FROM todos;");
+   const todos = await db.query("SELECT id, text FROM todos WHERE is_completed = FALSE;");
    return todos;
  };
~~~

This means that our backend code needs to be changed and re-deployed.
In general, with RPC,
anytime the frontend wants to change a query, the backend code needs to be changed and re-deployed.

Being able to change the backend at the whim of the frontend is *the* central prerequisite for using RPC.

REST/GraphQL, on the other hand, decouples:
as long as the schema doesn't change,
the frontend and backend can be developed independently of each other.
The backend could even entirely switch its database without having to do a single change to the frontend.

One way to think about the schema (and therefore about REST/GraphQL) is that it
acts as a rigid long-term contract between the frontend and the backend.

To sum up:
- The schema of a REST/GraphQL API abstracts the database away from the frontend.
- RPC is schemaless: the frontend uses SQL/ORM queries to retreive/mutate data.
- A schema allows a decoupled development of the frontend and backend.
- Schemaless is simpler and more powerful but requires the frontend to be developed hand-in-hand with the backend.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Case Studies

In this section
we explore whether RPC or REST/GraphQL should be used upon concrete situations.

**Prototyping**

Let's imagine a single full-stack developer
writting a prototype on its own.

The frontend and backend are devloped hand-in-hand
since the prototype is developed by a single developer;
the developer can use RPC and
any SQL/ORM query to retrieve/mutate data while developing the frontend.

Since the frontend and backend don't need to be decoupled
a schema (and therefore REST/GraphQL) is not necessary.

Not only is a schema unnecessary
but is also an indirection that gets in the way of quickly evolving the prototype;
anytime the developer makes a change to the database's schema he has to propagate the change to the schema of the REST/GraphQL API.

If the prototype evolves into becoming a large scale project, RPC can be progressively replaced with REST/GraphQL.

For a full-stack developer writting a prototype there is virtually no reason to not use RPC.

**Third parties**

As explained in
[Schema vs Schemaless](#schema-vs-schemaless),
being able to change the backend code at the whim of the frontend is the central prerequisite for using RPC.

A schema and REST/GraphQL is required for an API that is meant to be consumed by third parties.

For example,
Facebook uses a GraphQL API to
enable third parties to build applications on top of Facebook's social graph.
This makes sense since Facebook cannot modify its API at the whim of each third party &mdash; RPC is not an option.
A GraphQL API is fitting as it allows third parties to extensively access Facebook's social graph.

The schema abstracts away the database which is absolutely necessary for Facebook.
It would be prohibitive for Facebook to tighly couple its backend with third parties as it
would hinder Facebook's ability to develop the backend.

Facebook's GraphQL schema essentially acts as a rigid long-term contract between Facebook's API and third parties,
which is a good thing since third parties don't want to change how they consume Facebook's API all too often.

In short, if your API is consumed by third parties, then you have no choice than to use REST/GraphQL.

However, having two APIs can be a successful strategy:
a RESTful/GraphQL API for third parties and
an RPC API for your own frontend.
Giving your frontend the super power to be able to use any SQL/ORM query for data requirements that your REST/GraphQL API cannot fullfill.

**Hand-in-hand development**

In genreal,
if the backend team is willing to modify and re-deploy the API whenever the frontend needs a change,
then RPC offers a simpler and more powerful alternative over REST/GraphQL.

If you have a 1:1 relationship between frontend and backend
(that is the frontend is the only frontend of the backend and vice versa),
then a hand-in-hand development is most likely a good thing in itself.
<!---
, as explained [here].
-->

**Large teams**

For large projects,
decoupling the frontend team from the backend team can be a crucial strategy to scale.

As explained in
[Schema vs Schemaless](#schema-vs-schemaless),
a REST/GraphQL API allows you to decouple frontend development from backend development.

RPC can still be used by
setting up an API server that: (a) has direct access to the backend's database, (b) exposes an RPC API, and (c) is developed and maintained by the frontend team.
This allows the frontend team to develop independently of the backend team and vice versa.
One way to think about such RPC API server is that it acts as a thin permission layer between frontend and database.
The API server is stateless and can be deployed and scaled as a serverless service.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



## Conclusion

We have seen that the fundamental difference between RPC and REST/GraphQL is that
RPC is schmelass whereas REST/GraphQL uses a schema.
This schema acts as a rigid long-term contract between frontend and backend.

Such rigid long-term contract is required for APIs consumed by third parties.
It can also be beneficial in enabling large frontend and backend teams to work independently of each other.

For prototyping,
and in general for a frontend developed hand-in-hand with the backend,
RPC is simpler, faster to develop, more flexible, more performant, and more powerful.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#readme"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>




<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc.template.md` and run `npm run docs` (or `yarn docs`).






-->
