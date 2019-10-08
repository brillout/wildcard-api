!INLINE ./header.md --hide-source-path
&nbsp;

# RPC vs REST/GraphQL

This document explains: (a) what RPC is; and (b) how it compares to REST/GraphQL.

> :heavy_check_mark: After reading this document, you will know how to choose the right tool for the job.

- [What is RPC](#what-is-rpc)
- [Schema vs Schemaless](#schema-vs-schemaless)
- [Case Studies](#case-studies)
- [Conclusion](#conclusion)

<br/>

## What is RPC

The [Wikipedia RPC article](https://en.wikipedia.org/wiki/Remote_procedure_call) has a decent explanation:

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
  const {message} = await endpoints.hello('Alice');
  console.log(message); // Prints `Welcome Alice`
})();
~~~

What we are doing here is RPC:
our function `hello` is executed on the Node.js server but called remotely in the browser.

In the context of web development,
RPC is usually used to call SQL/ORM queries in order to retrieve or mutate data.
For example:

~~~js
// Node.js

const endpoints = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  const user = await getLoggedUser(this.headers); // We talk about `this` later.

  if( !user ) {
    // The user is not logged-in.
    // We abort.
    // (This is basically how you define permissions with Wildcard
    // which we will talk more about later.)
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

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Schema vs Schemaless

The fundamental difference between RPC and REST/GraphQL is that RPC is schemaless whereas REST/GraphQL has a schema.

Let's for example consider a todo list.

A RESTful API of a simple todo list app would have a schema queries like this:
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

// We get the list of todos by using the schema operation `HTTP GET /todos`.

async function fetchTodos() {
  const response = await window.fetch('/todos', {method: 'GET'});
  const todos = await response.json();
  return todos;
};
~~~
~~~js
// Browser

import React from 'react';
import fetchTodos from './fetchTodos.js'
import useData from './react-hooks/useData.js';

// We use our `fetchTodos` function and React to render our todo list.

export default TodoList;

function TodoList() {
  const todos = useData(fetchTodos);

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

The important thing to note here is that the frontend never uses SQL/ORM queries directly.
Instead it is the RESTful API that runs SQL/ORM queries on behalf of the frontend.

From the perspective of the frontend, the schema and its queries is all there is:
the database and its SQL/ORM queries are hidden by the schema.
A frontend developer doesn't even have to know whether the database is MongoDB or PostgreSQL.

This is the raison d'être and the fundamental purpose of a schema:

> :bulb: The schema abstracts the database away.

To a Software Architect,
who is crucially concerned about keeping the Software Architecture as simple as possbile,
on of the most crucial goal of a Software Architect is to make the Software Architecture as simple as possible;
questions arise &mdash; what is the added benefit of using a schema? What is the justification of using a schema? Is a schema needed and can we get rid of it?

If you are, and rightfuly so, a minimalist you may ask yourself: what is the benefit of such additional abstraction?
I want my Software Architecture to be as simple as possible
the goal
the benefit of such decoupling.

This is the benefit of having a schema and we will talk more about it in a moment.
Before we delve into the benefits of this decoupling, let's see the same example but with implemented with RPC this time.

Before we talk about the benefits and drawbacks of having such schema, let's see the same example but implemented with RPC:

~~~js
// Node.js server

const db = require('your-favorite-sql-query-builder');
const {endpoints} = require('wildcard-api');

// We implement a `getAllTodos` function on the server that
// runs a SQL query in order to get the todo items.

endpoints.getAllTodos = async function() {
  const todos = await db.query("SELECT id, text FROM todos;");
  return todos;
};
~~~
~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

export default fetchTodos();

// We get the list of todos by (remotely) calling `getAllTodos`.

async function fetchTodos() {
  const todos = await endpoints.getAllTodos();
  return todos;
};
~~~

the frontend developer uses and writes SQL/ORM queries to retrieve/mutate data.
The database is fully exposed to the frontend developed and he has to know
how to write SQL/ORM queries.
In a sense this is the exact opposite of the previous example where the database is abstraced away from he frontend.

In a nutshell,
RPC is schemaless and SQL/ORM queries are used directly whereas REST/GraphQL uses a schema that essentially proxies SQL/ORM queries.

As we can see in this example,
with RPC there is no schema and we directly use SQL/ORM queries instead.

> :bulb: RPC is schemaless: the frontend developer directly writes and uses SQL/ORM queries to retrieve and mutate data.

This is, as we mentioned at the beginning of this section, the fundamental difference between RPC and REST/GraphQL:
with RPC the frontend uses SQL/ORM queries directly
whereas with REST/GraphQL
the frontned uses schema operations.

The question whether to use RPC or REST/GraphQL boils down to the following question: is a schema required?

We now explore the benefits and drawbacks of using a schema.

**SQL/ORM is powerful**

A benefit of RPC's schemaless approach is
that SQL/ORM queries are more powerful than schema operations. For example:

~~~js
// Node.js server

const db = require('your-favorite-sql-query-builder');
const {endpoints} = require('wildcard-api');

// Let's imagine the frontend adds a new button that, when clicked,
// sets all todo items as completed.

endpoints.setAllTodosAsCompleted = async function({text}) {
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

Achieving the same using schema operations:

~~~js
export default markAllCompleted;

// We use the schema operation `HTTP PUT /todos/{id}` to set each todo

async function markAllCompleted() {
  const response = await window.fetch('/todos', {method: 'GET'});
  const todos = await response.json();

  await Promise.all(todos.map(async todo => {
    // We have to make a HTTP request for each todo item. This is inefficient.
    await window.fetch('/todos/'+todo.id, {method: 'PUT', body: {id, is_completed: true}});
  });
};
~~~

In this example a schema is merely less efficient
but there are some situations where a schema makes things not even feasible.

In general,
SQL/ORM queries are more powerful than schema operations;
a schema is crippling.

> :information_source: **GraphQL's power**
> <br/>
> GraphQL improves the situation as GraphQL queries are more powerful than RESTful queries.
> But only to a certain degree &mdash; SQL/ORM queries are still significantly more powerful than GraphQL queries.


**Schemaless is simple**

RPC is simple:
there is no schema to define, no CRUD resolvers to write.

Instead, we simply define functions on our server and remotely call them in the browser allowing
our frontend to use whatever server-side tool we want to retrieve/mutate data, such as SQL or an ORM.
(You have to be [careful about permissions](/../../#permissions) though.)


**A schema decouples**

If RPC is simpler and SQL/ORM queries more powerful,
you could ask yourself what the benefit of using a schema and REST/GraphQL is?
The answer is that it decouples the frontend from the backend.

Let's imagine we want to change our frontend from our previous example
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

This means that our server code needs to be changed and re-deployed;
with RPC,
anytime the frontend wants to change a SQL/ORM query, the backend code needs to be changed and re-deployed.

Being able to change the backend code at the whim of the frontend is *the prerequisite* for using RPC.

REST/GraphQL, on the other hand, decouples:
as long as the schema and its operations don't change,
the frontend and backend can be developed independently of each other.
The backend could even switch entirely switch its database without having to do a single change to the frontend.

A schema is usually designed in a generic way,
in other words it is designed to be able to fulfill a maximum number of data requirements.
This allows the frontend to be developed without changing the backend:
In other words, with REST/GraphQL the frontend is more decoupled from the backend.

One way to think about the schema (and therefore about REST/GraphQL) is that it
acts as a rigid long-term contract between the frontend and the backend.

To sum up:
- The schema of a RESTful/GraphQL API abstracts the database away from the frontend.
- RPC is schemaless: the frontend directly uses SQL/ORM queries to retreive/mutate data.
- A schema allows a decoupled development of the frontend and backend.
- Given a hand-in-hand frontend-backend development, schemaless is simpler and more powerful.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Case Studies

In this section
we explore whether RPC or REST/GraphQL should be used upon concrete situations.

**Prototyping**

Let's imagine a single full-stack developer
writting a prototype on its own.

The prototype is developed by a single developer;
the frontend and backend are devloped hand-in-hand.
The developer can use RPC to be able to
use any SQL/ORM query to retrieve/mutate data while developing the frontend.

Since the frontend and backend don't need to be decoupled
a schema (and therefore REST/GraphQL) is not necessary.

Not only is a schema unnecessary
but is also an indirection that gets in the way of quickly evolving the prototype;
anytime the developer makes a change to the database's schema he also has to change the schema of the REST/GraphQL API.

If the prototype evolves into becoming large scale project, RPC can be progressively replaced with REST/GraphQL.

For a full-stack developer writting a prototype there is virtually no reason to not use RPC.

**Third parties**

As explained in
[Schema vs Schemaless](#schema-vs-schemaless),
being able to change the backend code at the whim of the frontend is the central prerequisite for using RPC.

An abstraction is absolutely necessary for Facebook.
It would be insane for Facebook to expose.
It would block Facebook's development of the backend.
Such decoupling abstraction that the schema is and that's a boon and an imperative for Facebook.
TODO

For example,
Facebook uses a GraphQL API to
enable third parties to build applications on top of Facebook's social graph.
This makes sense since Facebook cannot modify its API at the whim of each third party &mdash; RPC is not an option.
A GraphQL API instead is fitting as it allows any third party to extensively access Facebook's social graph.

The REST/GraphQL schema essentially acts as a rigid long-term contract between your API and third parties,
which is a good thing for third parties since they don't want to change how they consume your API all too often.

In short, if your API is consumed by third parties, then you have no choice than to use REST/GraphQL.

However, having two APIs can be a successful strategy: one RPC API for your own frontend and a REST/GraphQL API for third parties;
your frontend then has the priviledge to be able to use any SQL/ORM query for data requirements that your REST/GraphQL API cannot fullfill.

**Hand-in-hand development**

In genreal,
if the backend team is willing to modify and re-deploy the API whenever the frontend needs a change,
then RPC offers a simpler and more powerful alternative over REST/GraphQL.

If you have a 1:1 relationship between frontend and backend,
that is the frontend is the only frontend of the backend and vice versa,
then a hand-in-hand development is most likely a good thing in itself.
<!---
, as explained [here].
-->

**Large teams**

For large projects,
decoupling the frontend team from the backend team can be a crucial strategy.

As explained in
[Schema vs Schemaless](#schema-vs-schemaless),
a REST/GraphQL API allows you to decouple frontend development from backend development.

An alternative is to set up an API server that: (a) has access to the backend's database, (b) exposes an RPC API, and (c) is developed and maintained by the frontend team.
Such API server essentially acts as a thin permission layer between frontend and database.
The API server is stateless and can be easily deployed and scaled as a serverless service.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Conclusion

We have seen that the fundamental difference between RPC and REST/GraphQL is that
RPC is schmelass whereas REST/GraphQL uses a schema.
This schema acts as a rigid long-term contract between frontend and backend.

Such rigid long-term contract is required for APIs consumed by many third parties
and can be beneficial in enabling a large frontend team and a large backend team to work independently of each other.

For small teams
and for prototyping,
a hand-in-hand frontend and backend development with RPC is
simpler, faster, and more flexible.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



