<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="/docs/images/logo-title.svg" height="90" alt="Telefunc"/>
  </a>
</p>


&nbsp;

# FAQ

###### High-level
<a href=#how-does-rpc-compare-to-graphql-and-rest>How does RPC compare to GraphQL and REST?</a>
<br/>
<a href=#when-should-i-use-rpc-graphql-and-rest>When should I use RPC, GraphQL, and REST?</a>
<br/>
<a href=#which-one-is-more-powerful-graphql-or-rpc>Which one is more powerful, GraphQL or RPC?</a>
<br/>

###### Low-level
<a href=#doesnt-rpc-tightly-couple-frontend-with-backend>Doesn't RPC tightly couple frontend with backend?</a>
<br/>
<a href=#should-i-deploy-frontend-and-backend-at-the-same-time>Should I deploy frontend and backend at the same time?</a>
<br/>
<a href=#should-i-develop-frontend-and-backend-hand-in-hand>Should I develop frontend and backend hand-in-hand?</a>
<br/>
<a href=#how-can-i-do-versioning-with-rpc>How can I do versioning with RPC?</a>
<br/>
<a href=#how-should-i-structure-my-rpc-endpoints>How should I structure my RPC endpoints?</a>

<br/>

### How does RPC compare to GraphQL and REST?

Comparing RPC with REST/GraphQL is a bit like comparing apples to oranges:
they have different goals.

With GraphQL and REST (level-5) you create a *generic API*:
an API that aims to be able to fulfill a maximum number of data requirements.
A generic API enables third party developers to build all kinds of applications on top of your data.
If your goal is to enable third party developers to access your data,
then you need a generic API and you'll have to use REST or GraphQL.

With RPC you create a *custom API*:
an API that fulfills the data requirements of your clients and your clients only.
If your goal is to retrieve and mutate data from your web and/or mobile clients,
then RPC offers a simpler (and more powerful!) alternative.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### When should I use RPC, GraphQL, and REST?

Deciding whether to use RPC is simple:
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
Is your API meant to be used by third parties? Use REST or GraphQL.
<br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
Is your API meant to be used by yourself? Use RPC.

You may still want the structure of a RESTful or GraphQL API for a large app.
But this typically applies only for large companies and "premature optimization is the root of all evil"
&mdash;
start with
[RPC as default](/docs/blog/rpc-as-default.md#rpc-as-default)
and later switch to REST or GraphQL
when and only if the need arises.

Whether you should use [REST or GraphQL](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer) cannot be answered in a generic manner and depends on the specifics of your use case.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### Which one is more powerful, GraphQL or RPC?

Depends.

From the perspective of a third-party developer,
GraphQL queries are more powerful.

But, from the perspective of your frontend development,
RPC queries are more powerful.

With Telefunc,
while developing your frontend,
everything the backend can do is only one JavaScript function away:

~~~js
// Your Node.js server

const {endpoints} = require('telefunc/server');

endpoints.iHavePower = function() {
  // I can do everything the Node.js server can do
};
~~~
~~~js
// Your browser frontend

import {endpoints} from 'telefunc/client';

// The entire backend power is one JavaScript function away
endpoints.iHavePower();
~~~

The whole power of the backend is at your disposal while developing your frontend.
For example,
you can use any SQL/ORM you want to retrieve and mutate data.
That's more powerful than GraphQL queries.

The difference is that,
from the perspective of a third-party developer,
your API is set in stone
whereas,
from the perspective of your frontend development,
you can modify your own API at will.

That's why you should use GraphQL (or REST level-5) if your API is meant to be used by third-party developers and RPC otherwise.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>

## Low-level FAQ

### Doesn't RPC tightly couple frontend with backend?

Yes it does.
RPC indeed induces a tighter coupling between frontend and backend.
More precisely, RPC increases the need for synchronized frontend-backend deployments.

Let's for example consider following endpoint:

~~~js
// This API endpoint is tightly coupled to the frontend:
// it returns exactly and only what the landing page needs.
endpoints.getLandingPageData = async function() {
  const {user} = this;
  if( !user ){
    return {isNotLoggedIn: true};
  }
  const todos = await db.query('SELECT id, text FROM todos WHERE authorId = ${user.id};');
  return {user, todos};
};
~~~

If changes are made to the frontend that, for example, require the todo items' creation date,
then the SQL query of the `getLandingPageData` API endpoint needs to be changed from `SELECT id, text FROM` to `SELECT id, text, created_at FROM`.
This means that the API needs to be modified and re-deployed.

In general (and regardless whether you use RPC or REST/GraphQL),
it has nowadays become best practice to
deploy backend and frontend at the same time,
which we talk about in the next querstion
<a href=#should-i-deploy-frontend-and-backend-at-the-same-time>Should I deploy frontend and backend at the same time?</a>.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### Should I deploy frontend and backend at the same time?

Yes, we recommend synchronized deployments, that is to deploy frontend and backend at the same time.

If your backend is written with Node.js,
we recommend to put your frontend and backend code in the same repository.

(This technique is commonly called "monorepo": a monorepo is a repository that holds the codebase of many different components of a system, instead of having a multitude of repositories each holding the codebase of a single component.
Monorepos are increasingly popular; a monorepo makes it easier to perform changes across system components and removes the need for versioning between system components.)

A monorepo with synchronized frontend and backend deployment
is easy to acheive with Node.js.
For example with an Express server:

~~~js
// Node.js server
const express = require('express');
const server = express();

// We serve and deploy our frontend over our Node.js server:
server.use(express.static('/path/to/frontend/dist/'));
~~~

That way your frontend and backend are always deployed synchronously.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### Should I develop frontend and backend hand-in-hand?

You can, but you don't have to.

Although,
there are less and less engineers that only do frontend;
most engineers that write browser-side JavaScript are nowadays also comfortable and eager
to write server-side JavaScript.
It nowadays makes sense to hire full-stack engineers and develop frontend and backend hand-in-hand.

But, you can still have separation of concerns:
- Server-side code that is tighly coupled to the frontend (which includes the API endpoints that run SQL/ORM queries on behalf of the frontend) is developed by the frontend team.
- The rest of the server-side code is developed by the backend team.

The strict separation between browser-side code and server-side code makes less and less sense and
, to a frontend engineer, RPC is a boon:
it gives him the power to use any SQL/ORM query and any server-side tool he wants.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### How can I do versioning with RPC?

As explained in
<a href=#should-i-deploy-frontend-and-backend-at-the-same-time>Should I deploy frontend and backend at the same time?</a>,
we recommend to deploy frontend and backend synchronously.
You then don't need
versioning as your backend only serves the latest version of your API.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### How should I structure my RPC endpoints?

RPC brings frontend and backend together in a seamless fashion.
RPC is agnostic to structure; how you structure your code is entirely up to you.

You may therefore ask yourself "How should I structure my endpoints?".

**The short answer**

Don't worry about it &mdash; you'll figure it out as you go.
(The structure of your code will be determined mostly by your business logic and only marginally by RPC.)

**The long answer**

For example, should one do this:

~~~js
// We have one generic mutation endpoint.
endpoints.updateTodo = async function({id, text, completed}) {
  const todo = await Todo.findOne({id});
  if( text!==undefined ) todo.text = text;
  if( completed!==undefined ) todo.completed = completed;
  await todo._save();
};
~~~

Or this:

~~~js
// We create a mutation endpoint for each action.
endpoints.updateTodoText = async function({id, text}) {
  await updateTodo({id, text});
};
endpoints.updateTodoCompleted = async function({id, completed}) {
  await updateTodo({id, completed});
};

async function updateTodo({id, text}) {
  const todo = await Todo.findOne({id});
  if( text!==undefined ) todo.text = text;
  if( completed!==undefined ) todo.completed = completed;
  await todo._save();
}
~~~

The answer is that it doesn't make a difference.
And that's the whole point:
your code structure will be determined more by your business logic and less by your RPC endpoints.

That said,
you can simply start to create
one endpoint per need:

~~~js
// We create endpoints for each page.

// Get data for https://example.com
endpoints.getLandingPageData = async function() {
  const todos = await (
    Todo
    .find({userId: this.user.id, completed: false})
    // We only retrieve the fields that the landing page needs
    .select(['id', 'text'])
  );

  return {
    user: {
      name: this.user.name,
    },
    todos,
  };
};
// Get data for https://example.com/account
endpoints.getUserAccountPageData = async function() {
  const {user} = this;
  return {
    user: {
      name: user.name,
      email: user.email,
      isPaidAccount: user.isPaidAccount,
      /* ... */
    }
  }
};

// We create endpoints for each user action:

endpoints.toggleTodoCompleted = async function(id) {
  const todo = Todo.findOne({id});
  todo.completed = !todo.completed;
  await todo._save();
};
endpoints.createNewTodo = async function (text) {
  const todo = new Todo({text});
  await todo._save();
  return todo.id;
};
endpoints.updateTodoText = async function({id, text}) {
  const todo = Todo.findOne({id});
  todo.text = text;
  await todo._save();
};
~~~

That is, each endpoint call will occur exactly once in the frontend code.

This works for most uses cases.
But, in doubt,
use your best judgement.

Bear in mind that, in general, it's best to create few structures and abstractions.
Too many structures are most often counter-productive.

To conclude,
how you strucutre your code has less to do with RPC and more to do with your business logic.


<br/>

<p align="center">

<sup>
<a href="https://github.com/telefunc/telefunc/issues/new">Open a GitHub ticket</a>
if you have questions or something's not clear &mdash; we enjoy talking with our users.
</sup>

<br/>

<sup>
<a href="#faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>




<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/faq.template.md` and run `npm run docs` (or `yarn docs`).






-->
