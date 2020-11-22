<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="/docs/images/logo-title.svg" height="90" alt="Telefunc"/>
  </a>
</p>
&nbsp;

# What is RPC?

The [Wikipedia article](https://en.wikipedia.org/wiki/Remote_procedure_call) explains RPC well:

> [...] A remote procedure call (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

This is the formal definition;
the term RPC is often used loosely to denote RPC-like approaches such as
creating [JSON endpoints](/docs/blog/rest-rpc.md#json-endpoints).
(RPC-like essentially denotes an API that is schemaless &mdash; in contrast to RESTful and GraphQL APIs which always have a schema.)

**Example**

RPC example between frontend and backend using Telefunc:

~~~js
// Node.js server

const {endpoints} = require('telefunc/server');

// We define a function (aka procedure) `hello` on a Node.js server.
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'telefunc/client';

(async () => {
  // We call the procedure `hello` remotely from the browser — we do *R*emote *P*rocedure *C*all
  const {message} = await endpoints.hello('Elisabeth');
  console.log(message); // Prints `Welcome Elisabeth`
})();
~~~

Our function `hello` is executed on the Node.js server but called remotely in the browser.

**RPC & Web Dev**

In the context of web development,
RPC is typically used to allow the frontend to retrieve and mutate data using SQL or ORM queries.
For example:

~~~js
// Node.js server

const {endpoints} = require('telefunc/server');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  if( !this.user ) {
    // The user is not logged-in.
    // We abort.
    // (This is basically how you define permissions with RPC
    // which we talk more about in Telefunc's documentation.)
    return;
  }

  // With an ORM:
  const newTodo = new Todo({text, authorId: this.user.id});
  await newTodo.save();

  /* Or with SQL:
  const db = require('your-favorite-sql-query-builder');
  const [newTodo] = await db.query(
    "INSERT INTO todos VALUES (:text, :authorId);",
    {text, authorId: this.user.id}
  );
  */

  return newTodo;
};
~~~

~~~js
// Browser

const {endpoints} = require('telefunc/client');

const newTodo = await endpoints.createTodoItem('Buy chocolate');
console.log(newTodo.id);
~~~


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
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
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/what-is-rpc.template.md` and run `npm run docs` (or `yarn docs`).






-->
