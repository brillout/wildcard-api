The [Wikipedia article](https://en.wikipedia.org/wiki/Remote_procedure_call) explains it well:

> [...] A **r**emote **p**rocedure **c**all (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

For example a frontend with a Node.js backend and Wildcard:

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
RPC can be used with SQL/ORM queries in order to retrieve/mutate data.
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
