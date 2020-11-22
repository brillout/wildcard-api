<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).






-->
# RPC vs REST/GraphQL

> :information_source:
> Instead of reading this document, you can follow RPC's rule of thumb:
> <br/>
> You want to create an API that will be consumed...
> <br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
> ...by code written by third parties? Use REST/GraphQL.
> <br/> &nbsp;&nbsp;&nbsp;&#8226;&nbsp;
> ...by code written by yourself / your organization? Use RPC.
> <br/>
> However, if you're curious, read one &mdash; this document explains the rationale behind the RPC rule.

RPC and REST/GraphQL have different goals and comparing them is like comparing apples to oranges.
We explain in which situations whether RPC or REST/GraphQL should be used by discussing the JavaScript implementation of a to-do list app.

Let's imagine we have a database filled with to-do items:
~~~sql
SELECT text FROM todo_items;
     text
--------------
Buy milk
Buy chocolate
Buy bananas
~~~

If we'd want to print the list of to-do items in our terminal from within our backend code,
we'd use a SQL query like we just did, and
there is (obviously) no need for a REST/GraphQL API.

~~~js
// print-todos.js

const db = require('your-favorite-sql-query-builder');

(async () => {
  const todos = await db.query('SELECT text FROM todo_items;');
  console.log(todos);
})();
~~~
~~~shell
$ node ./print-todos.js
[
  { text: 'Buy milk' },
  { text: 'Buy chocolate' },
  { text: 'Buy bananas' }
]
~~~

Now let's imagine we want to build a CLI to interface with our to-do list.

~~~shell
$ todos list
Your to-do list is:
 - Buy milk
 - Buy chocolate
 - Buy bananas
~~~
~~~shell
$ todos create 'Buy apples'
New to-do successfuly created:
 - Buy apples
~~~

Here again, a REST/GraphQL API wouldn't bring any benefit;
we can simply use SQL queries instead:

~~~js
cli.command('list').action(async () => {
  const todos = await db.query('SELECT text FROM todo_items;');
  console.log('Your to-do list is:');
  console.log(todos.map(({text}) => ' - '+text).join('\n'));
});

cli.command('create <text>').action(async text => {
  await db.query("INSERT INTO todo_items VALUES (:text);", {text});
  console.log('New to-do successfuly created:');
  console.log(' - '+text);
});
~~~

Now, let's imagine we want to implement a private frontend that has same functionallity as our CLI.
Do we need REST/GraphQL? Let's try with RPC and see how far we get.

~~~js
// Node.js server

// We use RPC by creating a Telefunc.
const {endpoints} = require('telefunc/server');

const db = require('your-favorite-sql-query-builder');

// We wrap our SQL queries in RPC endpoints to be able to call
// them from the browser.

endpoints.getTodoList = async function() {
  const todos = await db.query("SELECT id, text FROM todo_items;");
  return todos;
};

endpoints.createTodo = async function({text}) {
  await db.query("INSERT INTO todo_items VALUES (:text);", {text});
};
~~~

~~~jsx
// Browser

import React, {useState} from 'react';
import usePromise from './react-hooks/usePromise.js';
import {endpoints} from 'telefunc/client';

export default TodoList;

function TodoList() {
  const todos = usePromise(() => endpoints.getTodoList());

  if( !todos ) return <div>Loading...</div>;

  return (
    <div>
      Your to-do list is:
      <ul>
        {todos.map(todo =>
          <li key={todo.id}>{todo.text}</li>
        )}
      </ul>
      <NewTodo/>
    </div>
  );
}

function NewTodo() {
  const [text, setText] = useState('');

  return (
    <form onSubmit={addTodo}>
      <input type="text" onChange={ev => setText(ev.target.value)} value={text}/>
      <button type="submit">Add</button>
    </form>
  );

  async function addTodo(ev) {
    setText('');
    await endpoints.createTodo({text});
    // (A proper implementation would refresh the to-do list
    // to include the newly created to-do item.)
  }
}
~~~

RPC works out here:
our private frontend merely needs our two RPC endpoints `getTodoList` and `createTodo` and doesn't need anything else.

Let's make our frontend public and let's allow any arbitrary user to create a to-do list.
Do we now need REST/GraphQL?
Let's try with RPC by modifying our RPC endpoints like the following.

~~~diff
  // Install the Wildcard middlware
  app.use(wildcard(async req => {
    const context = {
+     // Authentication middlewares usually make user information available at `req.user`
+     user: req.user
    };
    return context;
  }));
~~~
~~~diff
  // Node.js server

  const {endpoints} = require('telefunc/server');

  const db = require('your-favorite-sql-query-builder');

  endpoints.getTodoList = async function() {
+   const {user} = this;
+   // We add permission: only a logged-in user can get his to-do list.
+   if( !user ) return;
+   return await db.query("SELECT id, text FROM todo_items WHERE userId = :userId",{userId: user.id});
-   return await db.query("SELECT id, text FROM todo_items");
  };

  endpoints.createTodo = async function({text}) {
+   const {user} = this;
+   // Permission: only a logged-in user is allowed to create a to-do item.
+   if( !user ) return;
+   await db.query("INSERT INTO todo_items VALUES (:text, :userId)", {text, userId: user.id});
-   await db.query("INSERT INTO todo_items VALUES (:text)", {text});
  };
~~~

~~~js
// Browser

// Our `TodoList` React component stays the same.
// But we only show `<TodoList />` to logged-in users
// and we add a login/signup page.
~~~

RPC still works for us!
We just have to be careful,
now that the frontend is public,
to make our RPC endpoints safe by adding permission.

Our frontend still only needs our two RPC endpoints `getTodoList` and `createTodo` and we still don't need REST/GraphQL.
We simply wrap our SQL queries in safe RPC endpoints.
RPC offers a simple solution even for public frontends!

RPC, however, has one constraint which we will talk abut later.
There is one constraint with RPC which we will talk about later.
But, before we do, let's look at how powerful RPC is.

**RPC Power**

Not only is RPC simple but it is also powerful:
RPC enables the frontend to use any SQL query, any ORM/ODM query, and any other server-side tool.

For exampe,
if we'd want to add a button "Mark all to-dos as completed" to our frontend,
with RPC,
we would simply write a new SQL query and wrap it in a safe RPC endpoint:

~~~js
endpoints.markAllCompleted = async function() {
  const {user} = this;
  // Only a logged-in user is allowed to do this.
  if( !user ) return;
  await (
    db.query("UPDATE todo_items SET is_completed = TRUE WHERE userId = :userId;', {userId: user.id})
  );
};
~~~

Such operation is notoriously problematic with REST.
(It's commonly called the N+1 problem.)
Whereas with RPC we can simply use SQL.

There are a whole range of SQL queries that are not feasible with REST.
RPC doesn't have such limitation.
GraphQL is more powerful than REST but there are still many types of queries that are not feasible with GraphQL.
SQL and RPC are vastly more powerful than RESTful and GraphQL queries.

NoSQL databases allow you to "program" your queries which is as well vastly more powerful
than RESTful and GraphQL queries.

In general,
using database native queries is always more powerful
than REST and GraphQL:
in the end,
a RESTful/GraphQL API
does nothing more than execute native database queries.

That said, there are situations where RPC cannot be used which warrant the usage of REST and GraphQL.

**The RPC constraint**

Throughout our journey we repeatedly modified our RPC endpoints.
This ability to change RPC endpoints at will is at the cornerstone of RPC.
If our two RPC endpoints of the beginning were fixed and unchangeable,
then we wouldn't have been able to evolve our frontend like we did.
RPC endpoints that are set in stone prevent any further frontend development.

> :bulb: RPC requires that endpoints can be created and modified at the whim of the frontend development.

This constraint of RPC is usually not a problem:
most frontend developers are nowadays comfortable and eager to write endpoints for themselves, and
hand-in-hand deployment of frontend and backend is nowadays considered best practice.
We elaborate more on these points in our [FAQ](/docs/faq.md#faq).

The RPC constraint is, however, problematic for third parties.

**Third parties**

A third party cannot modify our RPC endpoints.
From the perspective of a third party, our RPC endpoints are set in stone.

Imagine we'd want to enable third parties to build applications on top of our to-do lists database.
So that someone could, for example, integrate his to-do list with his favorite calendar app.
But our RPC endpoints `getTodoList` and `createTodo` are tailored and only useful to our frontend;
for a third party our two endpoints are virtually useless &mdash;
we need to offer a RESTful or GraphQL API.
We then have two APIs:
a RESTful (or GraphQL) API used by third parties and an RPC API used by our frontend.

Whereas RPC is schemaless,
a RESTful/GraphQL API has a schema which, in essence, is a generic interface to our data:
any third party can arbitrarily use any CRUD operation on any schema model.
This makes sense:
the goal of RPC is to fulfill the data requirements of only our frontend whereas
the goal of REST and GraphQL is to be able to fulfill a maximum number of data requirements.

**Conclusion**

To conclude,
we have seen that
RPC is simpler and more powerful than REST/GraphQL
if the endpoints can be modified at the whim of the frontend,
which is typically the case for an API used by ourself,
and definitely not the case for an API used by third parties.
This is the rationale behind the RPC rule:
- RPC is simpler and more powerful than REST/GraphQL for an API that is consumed by code written by ourselves.
- RPC is not an option for an API that is used by third party code &mdash; REST/GraphQL is required.


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
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/rpc-vs-rest-graphql.template.md` and run `npm run docs` (or `yarn docs`).






-->
