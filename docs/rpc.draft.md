# RPC vs REST/GraphQL

In this document, we illustrate the differences between RPC and REST/GraphQL in the context of web development.

> **TL;DR**
> - RPC is schemaless whereas REST/GraphQL has a schema.
> - A schema decouples frontend and backend.
> - For a frontend and a backend developed hand-in-hand, RPC is simpler and more powerful.
> - RPC excels for rapid prototyping while REST/GraphQL excels for APIs consumed by hundreds or more third parties.
> - One way to think about RPC is that's it is like any other programming library &mdash; it's just called remotaly instead of locally but all the programming paradigms you cherish and learned programming can be applied to RPC.

- [What is RPC]()
- [Schema vs Schemaless]()
- [Example where RPC is the best choice]()
- [Example where GraphQL/REST is the best choice]()
- [Conclusion]()

### What is RPC

The [Wikipedia RPC article](https://en.wikipedia.org/wiki/Remote_procedure_call) has a decent definition:

> [...] A remote procedure call (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

An example with Wildcard:

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

// We define a function (aka procedure) `hello` in Node.js
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  // We call `hello` remotely in the browser
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



### Schema vs Schemaless

> **TL;DR**
> - The schema abstracts SQL/ORM queries away from the frontend.
> - The schema decouples frontend development from backend development.
> - RPC is schemaless and the frontend uses SQL/ORM queries directly instead.
> - RPC is simpler and more powerful when frontend and backend are developed hand-in-hand

The fundamental difference between RPC and REST/GraphQL is that
RPC is schemaless (SQL/ORM queries are used directly) whereas REST/GraphQL uses a schema that essentially proxies SQL/ORM queries.

Let's look at how that imp

For example, a RESTful API of a simple todo list app would have a schema model `todo` with following operations:
- `HTTP GET /todos` to list all todo items.
- `HTTP POST /todos` to create new todo item.
- `HTTP GET /todos/{id}` to read a todo item with the id `{id}`.
- `HTTP PUT /todos/{id}` to update a todo item with the id `{id}`.
- `HTTP DELETE /todos/{id}` to delete to delete a todo item with the id `{id}`.

The frontend can use one of these operations to retrieve/mutate a todo item.
For example to list all todo items:

~~~js
// Browser

const fetch

fetch({
  url:
  method: 'POST',
});
~~~

The interface for the frontend are these operations; the SQL/ORM queries are done by the RESTful API and hidden from the frontend developer.

The important thing to notice here is that SQL/ORM queries are fully abstracted away from the frontend:
the frontend only sees and works with the operations listed above: the schema *is* the interface.

The benefit of such abstraction is that it decouples frontend and backend:
as long as the RESTful API stays the same, the frontend can function.

On the other hand, such schema is crippling:
The frontend is limited to the schema queries which are vastly inferior to database queries such as SQL.
Many things cannot be achieve 
Using GraphQL alleviates the situation is much more powerful than REST but only to a certain degree: even though GraphQL is more powerful than REST, database queries are still vastly superior to GraphQL queries.

Let's now look at a RPC variant of our todo app example:

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

endpoints.createTodo({text: 'Buy milk'});
~~~
~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

endpoints.createTodo = async function({text}) {
  // With an ORM/ODM:
  const newTodo = new Todo({text, authorId: user.id});
  await newTodo.save();
  /* Or with SQL:
  */

  return newTodo;
};
~~~

As we can see there is no schema &mdash; instead, we use SQL/ORM queries directly.

This has the benefit of being able to use any SQL/ORM query while developing the frontend.
That's more powerful than REST/GraphQL queries.

It is also simpler: there is virtually no setup necessary as with RPC you simpy define functions on your server and remotally call them in your browser.
In your function you can do whatever you want and use whatever server-side tool at your disposal such as SQL/ORM/etc.
(You do have to be [careful about permission]() here though.)
That's dead simple.

The schemaless approach of RPC is simpler:
no need to define a schema and CRUD operations on each model &mdash;
instead we can use SQL/ORM queries directly.

And, being able to use any SQL/ORM query while developing the frontend is powerful. For example:

~~~js
//
endpoints.setAllTodosAsCompleted = async function({text}) {

  return newTodo;
};
~~~

is and very inefficient as you'd need to call the create operation `HTTP POST https://example.org/api/todo` for each todo item.

Being able to use any SQL query is vastly more powerful than CRUD operations.

But, anytime the frontend wants to use a new or change a SQL/ORM query, the backend code need to be changed.
For example:

REST/GraphQL, on the other hand, enables the frontend to use CRUD operations on each model without requiring any modification to the backend code:
the backend can be set in stone, and the frontend can be developed independently of the backend development.

This ability to change the API at the whim of the frontend,
is
This is at the core of the decision whether to use RPC or REST/GraphQL.

To recap, the schemaless approach of RPC is simpler and more powerful whereas the schema approach of REST/GraphQL decouples frontend and backend.
For web development, whether to use RPC boils down to the following trade-off:
 - Con: Higher frontend - backend coupling
 - Pro: Simpler
 - Pro: More powerful




### Example where RPC is the best choice

**Prototyping**

For a prototype with a Node.js server and a React/Vue/Angular frontend
written by a single full-stack developer,
Wildcard offers a super simple way to create an RPC API.

Since the prototype is developed by a single developer,
the frontend and backend are devloped hand-in-hand,
and RPC is then super powerful as it allows the developer to use any SQL/ORM query to retrieve/mutate data while developing the frontend.

Not only is the schema approach of REST/GraphQL
an unnecessary indirection but it also gets in the way of quickly evolving the prototype;
anytime you make a change to your database's schema you will also have to change the schema of your REST/GraphQL API.

And, if the prototype happens to scale to a large project, RPC can be progressively replaced with REST/GraphQL.

For a full-stack JavaScript developer writing a prototype (for example with Next.js or Nuxt.js),
there is virtually no reason to not use RPC.

**Hand-in-hand development**

In genreal,
when the backend team is willing to modify and re-deploy the API whenever the frontend wants to change or use a new SQL/ORM query,
then RPC offers a simpler and more powerful alternative to REST/GraphQL (as explained in our previous section []()).

But if your backend and frontend are developed within the same organization,
and if the backend team is willing to modify the backend's API when the frontend needs a change,
then RPC is most likely the way to go.
The drawback of RPC is that the backend will have to change and re-deploy the API more frequently
but the added simplicity and powerfulness of RPC largely outweighs this drawback.

We discuss whether a highter frontend - backend coupling is a good thing in
[Tight frontend - backend development]()


### Example where REST/GraphQL is the best choice

**Third parties**

Facebook uses a GraphQL API to
enable third parties to build applications on top of Facebook's social graph.

Facebook cannot modify its API at the whim of each third party &mdash; RPC is not an option (as explained in []()).
Instead, a GraphQL API is fitting as it allows any third party to extensively access Facebook's social graph.

In a sense, REST/GraphQL
makes your schema redundent:
your data schema is defined twice: once on your database and a second time on your REST/GraphQL API.
The REST/GraphQL schema then essentially acts as a long-term contract between your API and third parties.
Such long-term rigidity is crucial for thrid parties that don't want to change how they consume your API anytime you make change in your data.

In short, if you API is consumed by third parties, then you need REST/GraphQL.

You can, however, have two APIs: one RPC API for your own frontend and a REST/GraphQL API for third parties;
your frontend then has the priviledge to be able to use any SQL/ORM query for data requirements that your REST/GraphQL API cannot fullfill.

**Large teams**

For large projects,
decoupling the frontend team from the backend team can be a crucial strategy.

As explained previously in [](),
a REST/GraphQL API allows you to decouple the frontend development from the backend development.

An alternative is to set up an API server that: (a) has access to the backend's database, (b) exposes an RPC API, and (c) is developed and maintained by the frontend team.
In essence, such API server acts as a thin permission layer between frontend and database.
The API server is stateless and can be easily deployed and scaled as a serverless service.


### Conclusion

We have seen that the prerequisite for using RPC is a hand-in-hand development of the API provider (usually developed by the backend team) and the API consumer (the frontend).

Given such hand-in-hand development, RPC is not only increadibly simple but also super powerful as it allows the frontend team to use any SQL/ORM query to retrieve/mutate data.

RPC excels for quickly writing prototypes while REST/GraphQL excels for APIs consumed by third parties.





### Auto-generated GraphQL

> :information_source: **Auto-generated GraphQL**
> <br/>
> Some frameworks automatically generate a GraphQL API for you.
> In that case using GraphQL instead of the ORM is fine.
> You still need to define permissions though
> (permissions are application specific and no framework can define permissions for you),
> and RPC can be used a thin permission layer.
> you always need to write permission.
> One way to think about it is that **RPC is a thin permission layer**.
> It's thin because with RPC you define permissions in a schema-less, structure-less, programmatic, and case-by-case way.


- learning the procedures of a remote API is very similar to learning a new programming library.
