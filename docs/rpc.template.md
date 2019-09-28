!INLINE ./header.md --hide-source-path
&nbsp;

> **TL;DR**
> <br/>
> - RPC is schemaless whereas REST/GraphQL has a schema.
> - REST/GraphQL's schema approach can be beneficial in decoupling frontend and backend.
> - RPC is simpler and more powerful for a frontend developed hand-in-hand with the backend.
> - RPC excels for rapid prototyping while REST/GraphQL excels for APIs consumed by many third parties.

# RPC vs REST/GraphQL

In this document, we illustrate the differences between RPC and REST/GraphQL in the context of web development.
We also show in what situations RPC or REST/GraphQL should be used.

- [What is RPC](#what-is-rpc)
- [Schema vs Schemaless](#schema-vs-schemaless)
- [Examples where RPC is the right choice](#examples-where-rpc-is-the-right-choice)
- [Examples where REST/GraphQL is the right choice](#examples-where-restgraphql-is-the-right-choice)
- [Conclusion](#conclusion)

<br/>

## What is RPC

The [Wikipedia RPC article](https://en.wikipedia.org/wiki/Remote_procedure_call) has a decent definition:

> [...] A remote procedure call (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

For example with Wildcard:

~~~js
// Node.js server

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
our function `hello` is exectued on the Node.js server but called remotely in the browser.

In the context of web development, RPC is usually used to remotely call SQL/ORM queries:

~~~js
// Node.js

const {endpoints} = require('wildcard-api');

endpoints.whateverTheFrontendNeeds = function(productId) {
  // Depending
  if( !productId || productId.constructor===Number ){
    return;
  }

  // In Here we can do whatever
  // In short, we can use the full server power for our frontend.
};
~~~

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Schema vs Schemaless

> **TL;DR**
> <br/>
> - The schema abstracts SQL/ORM queries away from the frontend.
> - The schema decouples frontend development from backend development.
> - RPC is schemaless and the frontend uses SQL/ORM queries directly instead.
> - RPC is simpler and more powerful when frontend and backend are developed hand-in-hand

The fundamental difference between RPC and REST/GraphQL is that
RPC is schemaless and SQL/ORM queries are used directly whereas REST/GraphQL uses a schema that essentially proxies SQL/ORM queries.

For example, a RESTful API of a simple todo list app would have a schema with operations like the following:
- `HTTP GET /todos` to list all todo items.
- `HTTP POST /todos` to create a new todo item.
- `HTTP GET /todos/{id}` to read a todo item with the id `{id}`.
- `HTTP PUT /todos/{id}` to update a todo item with the id `{id}`.
- `HTTP DELETE /todos/{id}` to delete to delete a todo item with the id `{id}`.

The frontend uses these schema operations to retrieve/mutate todo items.
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

// We can then use our `fetchTodos` function and React to render our todo list.

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

From the perspective of the frontend, the shema operations is all there is:
any SQL/ORM query is done by the RESTful API and is hidden from the frontend developer;
a schema abstracts the database away from the frontend.

Before we talk about the benefits and drawbacks of having such schema, let's see the same example but implemented with RPC:

~~~js
// Node.js server

const db = require('your-favorite-sql-query-builder');
const {endpoints} = require('wildcard-api');

// We implement a `getAllTodos` function on the server that
// runs a SQL query in order to get the todo items.

endpoints.getAllTodos = async function({text}) {
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

As we can see in this example,
with RPC there is no schema and we directly use SQL/ORM queries instead.

This is, as we mentioned at the beginning of this section, the fundamental difference between RPC and REST/GraphQL:
with RPC the frontend uses SQL/ORM queries directly
whereas with REST/GraphQL
the frontned uses schema operations.

Both the schema approach and the schemaless approach have their benefits which we now discuss.


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

A schema is usually designed in a generic way,
in other words it is designed to be able to fulfill a maximum number of data requirements.
This allows the frontend to be developed without changing the backend:
In other words, with REST/GraphQL the frontend is more decoupled from the backend.

One way to think about the schema (and therefore about REST/GraphQL) is that it
acts as a rigid long-term contract between the frontend and the backend.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Examples where RPC is the right choice

> **TL;DR**
> <br/>
> - RPC is most often the right choice for prototyping.
> - In general, RPC is the right choice when the frontend is developed hand-in-hand with the backend.

**Prototyping**

For a prototype
written by a single full-stack developer,
RPC is very likely the right choice.

Since the prototype is developed by a single developer,
the frontend and backend are devloped hand-in-hand.
The developer can therefore use RPC and use
any SQL/ORM query to retrieve/mutate data while developing the frontend.

Since the frontend and backend don't need to be decoupled
a schema (and therefore REST/GraphQL) is not necessary.

Not only is a schema unnecessary
but is also an unnecessary indirection that gets in the way of quickly evolving the prototype;
anytime the devloper makes a change to the database's schema he would also have to change the schema of the REST/GraphQL API.

And, if the prototype evolves into becoming large scale project, RPC can be progressively replaced with REST/GraphQL.

For a full-stack JavaScript developer writing a prototype with Node.js and React/Vue/Angular,
Wildcard can be used to easily create an RPC API and
there is virtually no reason to not use RPC.

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

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Examples where REST/GraphQL is the right choice

> **TL;DR**
> <br/>
> - REST/GraphQL is the right choice for APIs consumed by third parties.
> - The schema of REST/GraphQL can be beneficial in enabling the frontend to be developed independently of the backend.

**Third parties**

As explained in
[Schema vs Schemaless](#schema-vs-schemaless),
being able to change the backend code at the whim of the frontend is the central prerequisite for using RPC,

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
a hand-in-hand frontend and backend developmenet with RPC is
simpler, faster, and more flexible.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



