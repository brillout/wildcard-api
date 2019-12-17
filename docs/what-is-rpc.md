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
    <img src="/docs/images/logo-with-text.svg" height=106 alt="Wildcard API"/>
  </a>
</p>
&nbsp;

# What is RPC?

The [Wikipedia article](https://en.wikipedia.org/wiki/Remote_procedure_call) explains RPC well:

> [...] A remote procedure call (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

This is the formal definition;
the term RPC is often used loosely to denote RPC-like approaches,
such as
[custom JSON endpoints](/docs/blog/rest-and-rpc.md#custom-json-endpoints) or
[REST level 0](/docs/blog/rest-rpc.md#rest-level-0).
(Essentially any API that is schemaless, in contrast to a RESTful and GraphQL API that is based on schema.)

**Example**

RPC example between frontend and backend using Wildcard:

~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');

// We define a function (aka procedure) `hello` on a Node.js server.
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from '@wildcard-api/client';

(async () => {
  // We call the procedure `hello` remotely from the browser — we do *R*emote *P*rocedure *C*all
  const {message} = await endpoints.hello('Elisabeth');
  console.log(message); // Prints `Welcome Elisabeth`
})();
~~~

Our function `hello` is executed on the Node.js server but called remotely in the browser.

**RPC & web dev**

In the context of web development,
RPC is most often used in order to retrieve and mutate data with SQL or ORM queries.
For example:

~~~js
// Node.js server

const {endpoints} = require('@wildcard-api/server');
const Todo = require('./path/to/your/data/model/Todo');

endpoints.createTodoItem = async function(text) {
  if( !this.user ) {
    // The user is not logged-in.
    // We abort.
    // (This is basically how you define permissions with RPC
    // which we talk more about in Wildcard's documentation.)
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


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a GitHub ticket</a>
if you want to discuss, have questions, or if something is not clear &mdash; we enjoy talking with our users.
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
