# RPC vs REST/GraphQL

> :information_source:
> Instead of reading this document, you can follow RPC's rule of thumb:
> - Will your API be consumed by code written by third parties? Use REST/GraphQL.
> - Will your API be consumed by code written by yourself / your organization? Use RPC.
> But if you're curious, then read one &mdash; this document explains the rational behind the RPC rule.

RPC and REST/GraphQL have different goals and comparing them is like comparing apples with oranges.
We explain in which situations whether RPC or REST/GraphQL should be used by discussing a to-do list JavaScript implementation.

Let's imagine we have a database filled with to-do items:

~~~sql
SELECT text FROM todo_items;

     text
--------------
Buy milk
Buy chocolate
Buy bananas
~~~

If we'd want to print the to-do items in our terminal from our backend code,
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

Now, let's imagine we want to build a CLI to interface with our to-do list.

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
we can simply use SQL queries instead.

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

Now, let's imagine we want to build a private frontend with the same functionallity than our CLI.
Do we need REST/GraphQL? Let's try with RPC instead and see how far we get.

~~~js
// Node.js server

// We use RPC by creating a Wildcard API.
const {endpoints} = require('wildcard-api');

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

import React from 'react';
import usePromise from './react-hooks/usePromise.js';
import {endpoints} from 'wildcard-api/client';
import NewTodo from './NewTodo.js';

export default TodoList;

function TodoList() {
  const todos = usePromise(() => endpoints.getTodoList());

  if( !todos ) return <div>Loading...</div>;

  return <>
    Your to-do list is:
    <ul>
      {todos.map(todo =>
        <li key={todo.id}>{todo.text}</li>
      )}
    </ul>
    <NewTodo/>
  </>;
}

function NewTodo({setTodos}) {
  const [text, setText] = useState('');

  return (
    <form onSubmit={createTodo}>
      <input type="text" onChange={ev => setText(ev.target.value)} value={text}/>
      <button type="submit">New To-do</button>
    </form>
  );

  async function createTodo(ev) {
    ev.preventDefault();
    setText('');
    await endpoints.createTodo({text});
    const todos = await endpoints.getTodos();
    setTodos(todos);
  }
}
~~~

RPC does the trick: our private frontend merely needs our two RPC endpoints `getTodoList` and `createTodo` and doesn't need anything else.

Now let's make our frontend public and let's allow any arbitrary user to create a to-do list.
Do we need REST/GraphQL?
Again, let's try with RPC first.

~~~diff
  // Node.js server

  const {endpoints} = require('wildcard-api');

  const db = require('your-favorite-sql-query-builder');

+ // We add user authentication
+ const getLoggedUser = require('./path/to/your/auth/code');

  endpoints.getTodoList = async function() {
+   const user = getLoggedUser(this.headers);
+   // We add permission: only a logged-in user can get his to-do list.
+   if( !user ) return;
+   return await db.query("SELECT id, text FROM todo_items WHERE userId = :userId;", {userId: user.id});
-   return await db.query("SELECT id, text FROM todo_items;");
  };

  endpoints.createTodo = async function({text}) {
+   const user = getLoggedUser(this.headers);
+   // Permission: only a logged-in user is allowed to create a to-do item.
+   if( !user ) return;
+   await db.query("INSERT INTO todo_items VALUES (:text, :userId);", {text, userId: user.id});
-   await db.query("INSERT INTO todo_items VALUES (:text);", {text});
  };
~~~

~~~js
// Browser

// Our `TodoList` React component stays the same but
// we only show `<TodoList />` to logged-in users and
// we add a login/signup page.
~~~

RPC still works out!
we just have to be careful,
since the frontend is now public,
to make our RPC endpoints safe by adding permission code.

Our frontend still only needs our two RPC endpoints `getTodoList` and `createTodo` and we still don't need REST/GraphQL.
We simply wrap our SQL queries in safe RPC endpoints.

Not only is RPC simple, but it is also powerful:
RPC enables the frontend to use any SQL query, any ORM query, or any other server-side tool.

Imagine we want to add a button "Mark all to-dos as completed" to our frontend.
To that purpose, we would simply use a new SQL query and wrap it in a safe RPC endpoint:

~~~js
endpoints.markAllCompleted = async function() {
  const user = getLoggedUser(this.headers);
  // Only a logged-in user is allowed to do this.
  if( !user ) return;
  await db.query("UPDATE todo_items SET is_completed = TRUE WHERE userId = :userId;', {userId: user.id});
};
~~~

Such operation is notoriously problematic with REST.
(This problem is commonly called the N+1 problem.)
Whereas with RPC we can simply use SQL.

There are a whole range of queries that are not feasible with REST.
RPC doesn't have such limitation.
GraphQL is more powerful than REST but there still many types of queries that are only possible

In a sense

That said, there is a caveat here that explains the raison d'être of REST and GraphQL.

The whole power of SQL is at the frontend's disposal.

is notoriously difficult.
Many such queries are notoriously difficult,
and even sometimes,
to achieve.
SQL, on the hand, is known to be powerful.
Actually, for a SQL database, SQL is the powerful tool you can use to retrieve and mutate data.
RPC gives while developing a frontend.
Even GraphQL, which is more powerful than REST, is still vastly inferior to SQL.
Not only, makes any
server-side tool one function away.

In general, all relationship
RPC is vastly more powerful than REST here!
Even though GraphQL all
REST (and even GraphQL) is crippling.

Note that throughout our journey we repeatedly modified our RPC endpoints.
This ability to change the endpoints at will is crucial for RPC.
If our two basic RPC endpoints of the beginning were fixed and unchangeable,
we wouldn't have been able to evolve our frontend like we did.
In general, RPC endpoints that are set in stone prevent any further frontend development.

> :bulb: RPC requires that endpoints can be created and modified at the whim of the frontend development.

This constraint of RPC is usually not a problem:
most frontend developers are nowadays comfortable and eager to write endpoints for themselves, and
continous hand-in-hand deployment of frontend and backend is now considered best practice.
We elaborate more on these points in our [FAQ](/docs/faq.md#faq).

But, there is one situation were RPC's constraint is problematic: third parties.
A third party cannot modify our RPC endpoints: from the perspective of a third party, our RPC endpoints are set in stone.
Now, we developed our endpoints hand-in-hand with our frontend: our endpoints are tailored and only useful to our frontend.
In short, RPC's constraint is a show stopper for a third party that wants to develop an application on top of our data.

While RPC is schemaless,
a RESTful/GraphQL API has a schema that essentially is a generic interface to your data:
any third party can use any arbitrary CRUD operation on any schema model.
The schemaless approach of RPC only fulfills the data requirement of the frontend
whereas REST and GraphQL can fulfill all kinds of data requirements.

In our to-do list app,
on top of our database
if we want to enable third parties to build applications on top of our data,
then we'd need to offer a RESTful/GraphQL API.
We would still use and develop our RPC API for our own frontend.

To conclude,
we have seen that
RPC is simpler and more powerful than REST/GraphQL
if API endpoints can be modified at the whim of the frontend,
which is typically the case for APIs used by code written by ourself,
and definitely not the case for APIs used by third party code.














and separation of concern is nowadays between Frontend Aesthetics (e.g. HTML/JSX/CSS), Frontend Logic (JavaScript / State Management / Server-side API endpoints / Server-Side Rendering / Backend code related to Frontend), and Backend code that is agnostic to frontend (the old separation of concern browser-side has become obsolete). The best done on and between browser-side code and server-side code.

This is precisely the reason why RPC cannot be used for APIs meant to be consumed by third party code.


you choose:
- RPC constraint
- Schema constraint

When you think about it,
this is an inherent situations.
It's theoretically impossible to have an API that.
You have to choose one of the two constraint.


A RESTful or GraphQL API doesn't have that constraint.
Thi

So, when do we need REST/GraphQL?

The answer is when you third party code is 
there still no need for a REST nor GraphQL.

So when do we need
You may now ask yourself

~~~js
// We need authentication
getApiResponse({
  user,
});
~~~

~~~js
// This time though, the RPC API is public we need to be careful about permission

endpoints.
~~~

The RPC API is public but internal.
It is public: anyone on the internet can make a call to our RPC API.
It is internal: within the same organization.


Now, let's imagine we want to offer an API for people to build applications on top of our data.
For example, So that people can integrate their to-do list with their tools.

A third party cannot change our API.
But, as we have seen previously, this is required for RPC.


That is the reason why REST or GraphQL is need for third parties.

If have seen that for internal APIs,
when an API can be modified at will,
RPC is powerful while REST/GraphQL is crippling.
But for third parties,
for whom the API is set in stone,
it is the exact opposite.

So, if we want to give access to third parties,
then we have no choice than to offer a RESTful or GraphQL API.










You will never see a REST/GraphQL API used for inter-process communication.
That would be silly.




Should we use a REST/GraphQL API or

To understand the,
let's imagine we want to develop a CLI to a SQL database of a todo-list app.

Our CLI should be able to print all
~~~shell
$ todo list
~~~

Our database as only one 
the implication
The rest o
To understand the implication



a CLI tool that uses a SQL database.
























The essential nature of REST and GraphQL is that they are based on a schema whereas RPC is schemaless.

The schema of a REST/GraphQL API determines the entire interface between your backend and the API user.
For example, the schema of a todo-list app would look like this:

Uses these schema operations.
The schema fully abstracts the backend away:
All data access are done by schema operations.

This allows a third party to build all kinds of apps on top of your data simply by using these schema operations.
And that independently and without require changes.
In short, a schema provides a generic interface: to your data (so that all kinds of (generic a interface.

This gives the API consumer the power of being able to use all these schema operations. Let's now compare this with RPC.

Let's imagine we

To this purpose we would create a single RPC endpoint `getTodoList`:

~~~jsx
function TodoList({todos}) {
  return <div>
    {todos.map}
  </div>
}
~~~

~~~js
endpoints.getTodoList = function() {
}
~~~

This means

Our schema above is vastly more powerful than this mere single endpoint: the schema allows.
But that's not really a fair comparison as RPC assumes that we can.

That's why RPC is not used to create an API that will be consumed by code written by third parties.
From the perspective of a third party, your API is set in stone.
A third party needs something like a schema that provides him a generic interface to your data.

This is the essential feature of the schema and of REST/GraphQL:
It 
to be able.
That's why REST and GraphQL are used to create an API that is meant to be used by third parties.

> :bulb:
> If the API is set in stone, then REST/GraphQL is vastly more powerful than RPC.

If, however, we assume that the API can be modified at will then it's the exact opposite and it is
RPC that is vastly more powerful.

> :bulb:
> If the API can be modified at will, then RPC is vastly more powerful than REST/GraphQL.

> :bulb: RPC assumes that the developer using the API is able to modify the RPC API at will.

That is why RPC is only used to create an internal API,
that is an API that is consumed by code developed within the same organization.

To conclude,
REST and GraphQL are the right tools to create an API that is meant to be used by third parties.
otherwise RPC is the right tool.






This is the crucial aspect: being able to consume your API independently and wihtout you haveing. This, essentially, is the raison d'être of the schema and therefore the raison d'etre for REST and GraphQL.
This is the fundamental essence of REST/GraphQL and the schema: it allows 

In essense, the schema is a generic interface
You *need* a contract acting as a long-term relationship between API provider and API consumer.


RPC, in contrast, has no schema.
To most web developers, a schema will feel natural to create an internal API because REST and GraphQL are so widespread.
But, actually, RPC is the more natural approach for an internal API.
Not only is it the more natural and intuitive but it is also more powerful as we will now see.

Imagine you'd want to print . No, you'd use an ORM/SQL query instead.

Again no, you wouldn't.You'd directly use an ORM/SQL query instead:

Again.

What we are doing here, is that we are reproducing the the queries that a tipical todo-list app is doing.
All that without a schema.
That's the idea: you don't need a schema.
Not only don't you need a schema, but the schema is actually crippling.

Imagine, we'd want to set all todo list as complated (e.g. implement a toggle button, 

~~~js
~~~

To achieve the same with a schema is cumbersome.
Not only is a schema is an annoying and unecessary indirection,
but there are situations where a schema makes things impossible
that would normally easy to achieve wiht SQL/ORM.
(Everything related to relationships, e.g. "Remove all attachements of all todo-list" is not feasible with a schema)

That's the idea of RPC:
we directly use SQL/ORM queries instead of using a schema.

In the scenario described above, a schema doesn't add any value and is just an unecessary indirection.

Note that, while developing and re-deploying the frontend,
we need to be able to modify and re-deploy the endpoints of the RPC API.
We talk about this tight coupling and
about synchronised deployements in our [FAQ](/docs/faq.md#faq).

For internal APIs,
RPC is a simpler, more direct, more natural, more flexible, and more powerful approach.

Third parties,
on the other the hand,
need a schema which provides a generic interface and ensures a long-term and stable contract.
































!INLINE ./header.md --hide-source-path
&nbsp;

# RPC vs REST/GraphQL

This document explains: (a) what RPC is; and (b) how RPC compares to REST/GraphQL.

> :heavy_check_mark:
> After reading this document,
> you will be able to choose the right tool for the job:
> you will know in what situations whether RPC or REST/GraphQL should be used.

- [What is RPC](#what-is-rpc)
- [Schema vs Schemaless](#schema-vs-schemaless)
- [Case Studies](#case-studies)
- [Conclusion](#conclusion)

<br/>

## What is RPC

!INLINE ./snippets/what-is-rpc.md --hide-source-path

!INLINE ./snippets/section-footer.md #readme --hide-source-path



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

!INLINE ./snippets/section-footer.md #readme --hide-source-path



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
Giving your frontend the super power to be able to use any SQL/ORM query for data requirements that your REST/GraphQL API cannot fulfill.

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

!INLINE ./snippets/section-footer.md #readme --hide-source-path



## Conclusion

We have seen that the fundamental difference between RPC and REST/GraphQL is that
RPC is schmelass whereas REST/GraphQL uses a schema.
This schema acts as a rigid long-term contract between frontend and backend.

Such rigid long-term contract is required for APIs consumed by third parties.
It can also be beneficial in enabling large frontend and backend teams to work independently of each other.

For prototyping,
and in general for a frontend developed hand-in-hand with the backend,
RPC is simpler, faster to develop, more flexible, more performant, and more powerful.

!INLINE ./snippets/section-footer.md #readme --hide-source-path



