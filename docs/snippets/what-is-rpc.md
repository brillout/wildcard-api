The [Wikipedia article](https://en.wikipedia.org/wiki/Remote_procedure_call) explains RPC well:

> [...] A remote procedure call (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

This is the formal definition of RPC;
the term RPC is often used loosely to denote RPC-like approaches,
such as
[custom JSON endpoints](/docs/blog/rest-rpc-custom-endpoints.md#custom-json-endpoints) or
[REST level 0](/docs/blog/rest-rpc-custom-endpoints.md#rest-level-0).
(Essentially any API that is schemaless, in contrast to RESTful and GraphQL APIs that are based on schema.)

**Example**

RPC example between frontend and backend using Wildcard:

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
  // We call the procedure `hello` remotely from the browser — we do *R*emote *P*rocedure *C*all
  const {message} = await endpoints.hello('Elisabeth');
  console.log(message); // Prints `Welcome Elisabeth`
})();
~~~

Our function `hello` is executed on the Node.js server but called remotely in the browser.

**RPC & web dev**

In the context of web development,
RPC is used in order to retrieve and mutate data with SQL or ORM queries.
For example:

~~~js
// Node.js server

const endpoints = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  const user = await getLoggedUser(this.headers); // We explain `this` in Wildcard's documentation.

  if( !user ) {
    // The user is not logged-in.
    // We abort.
    // (This is basically how you define permissions with RPC
    // which we talk more about in Wildcard's documentation.)
    return;
  }

  // With an ORM:
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
