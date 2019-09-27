# RPC vs REST/GraphQL

In this document, we illustrate the differences between RPC and REST/GraphQL in the context of web development.
We also show in what situations RPC or REST/GraphQL should be used.

> **TL;DR**
> <br/>
> - RPC is schemaless whereas REST/GraphQL has a schema.
> - REST/GraphQL's schema approach can be beneficial in decoupling frontend and backend.
> - RPC is simpler and more powerful for a frontend developed hand-in-hand with the backend.
> - RPC excels for rapid prototyping while REST/GraphQL excels for APIs consumed by hundreds or more third parties.

- [What is RPC]()
- [Schema vs Schemaless]()
- [Examples where RPC is the right choice]()
- [Examples where GraphQL/REST is the right choice]()
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

const fetch

fetch({
  url:
  method: 'POST',
});
~~~

From the perspective of the frontend, these shema operations is all there is:
any SQL/ORM query is done by the RESTful API and is hidden from the frontend developer.
The frontend doesn't care whether the database is PostgreSQL or MongoDB database,
doesn't have to write any SQL/ORM query;
as far as the frontend is concerned, the backend is reduced by these schema operations.

In short: a schema abstracts the database and SQL/ORM queries away from the frontend.

Before we talk about the benefits and drawbacks of having such schema, let's see the same example but implemented with RPC:

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

endpoints.createTodo({text: 'Buy milk'});
~~~
~~~js
// Node.js server

// We assume the backend to be a Node.js server.

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

As we can see in this example,
there is no schema with RPC, instead we directly use SQL/ORM queries.

This is, as we mentioned at the beginning of this section, the fundamental difference between RPC and REST/GraphQL
is that with RPC the frontend uses SQL/ORM queries,
whereas with REST/GraphQL
the frontned uses schema operations.

Both the schema approach and the schemaless approach have their benefits and drawbacks which we now discuss.


###### SQL/ORM queries are more powerful than schema operations

A considerable benefit of RPC's schemaless approach is
that SQL/ORM queries are more powerful than schema operations. For example:

~~~js
// Let's imagine the frontend adds a new button that, when clicked,
// sets all todo items as completed.

endpoints.setAllTodosAsCompleted = async function({text}) {

  return newTodo;
};
~~~

Achieving the same using schema operations is tedious and inefficient:

~~~js

is and very inefficient as you'd need to call the create operation `HTTP POST https://example.org/api/todo` for each todo item.
~~~

As illustrated in this example,
SQL queries are significantly more powerful than schema operations.

> :information_source: **GraphQL**
> <br/>
> GraphQL alleviates the situation as GraphQL queries are more powerful than RESTful queries.
> But only to a certain degree &mdash; SQL/ORM queries are still significantly more powerful than GraphQL queries.

###### RPC is simple

RPC is simple:
there is no schema to define, no CRUD resolvers to write.

Instead, we simply define functions on our server and remotely call them in the browser allowing
our frontend to use whatever server-side tool we want to retrieve/mutate data, such as SQL or an ORM.
(You do have to be [careful about permissions]() though.)

And, RPC tools such as Wildcard require virtually no setup.


###### A schema decouples

If RPC is simpler and SQL/ORM queries more powerful, what's the benefit of using a schema and REST/GraphQL?
The answer is that it decouples the frontend from the backend.

Let's re-consider our RPC example from above:
- Note how is defined in the Node.js server.

Let's imagine we change our frontend to only show non-completed todo items. For that we need to change our query:

~~~js
and we now need the `isCompleted` properties of todo items
then we would have to change the function `ehui` defined on the Node.js server.
~~~

As we can see in this example,
anytime the frontend wants to change a SQL/ORM query, the backend code needs to be changed and re-deployed.

REST/GraphQL, on the other hand, decouples:
as long as the schema doesn't change, the frontend and backend can be developed independently of each other.
REST/GraphQL, on the other hand,
as long as the needs are covered by the schema operations, the frontend can be developed independently of the backend.

Because the schema is designed in a generic way,
in other words designed in a way to be able to fulfill lots of data requirements,
a frontend development with REST/GraphQL will require less backend modifications than with RPC API.
This means that, with REST/GraphQL, the frontend is more decoupled from the backend.

One way to think about the schema (and therefore about REST/GraphQL) is that it
acts as a rigid long-term contract between the frontend and the backend
enabling a decoupled development.



### Examples where RPC is the right choice

> **TL;DR**
> <br/>
> - RPC is most often the right choice for prototyping.
> - In general, RPC is the right choice when the frontend is developed hand-in-hand with the backend.

**Prototyping**

For a prototype with a Node.js server and a React/Vue/Angular frontend
written by a single full-stack developer,
Wildcard offers a super simple way to create an RPC API.

Since the prototype is developed by a single developer,
the frontend and backend are devloped hand-in-hand,
and RPC is then super powerful as it allows the developer to use any SQL/ORM query to retrieve/mutate data while developing the frontend.

a schema is crippling

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

But, if your backend and frontend are developed within the same organization,
and if the backend team is willing to modify the backend's API when the frontend needs a change,
then RPC is the way to go.
The drawback of RPC is that the backend will have to change and re-deploy the API more frequently
but the added simplicity and powerfulness of RPC largely outweighs this drawback.

If you have a 1:1 relationship between frontend and backend,
that is your frontend is the only frontend of your backend and vice versa,
then a hand-in-hand development is likely a good thing in itself.

We discuss whether a highter frontend - backend coupling is a good thing in
[Tight frontend - backend development]()


### Examples where REST/GraphQL is the right choice

> **TL;DR**
> <br/>
> - REST/GraphQL is the right choice for APIs consumed by third parties.
> - The schema of REST/GraphQL can be beneficial in enabling the frontend to be developed independently of the backend.

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

We have seen that the fundamental difference between RPC and REST/GraphQL is that RPC is schmelass where as REST/GraphQL uses a schema that
effectively acts as a rigid long-term contract between frontend and backend.

Such rigid long-term contract is required for APIs consumed by hundreds or more third parties,
and can beneficial in enabling a large frontend team and a large backend team to work independently of each other.

For small teams,
and most notably when prototyping,
a hand-in-hand frontend and backend developmenet with RPC is
simpler, faster, and more flexible.

Given a hand-in-hand frontend and backend development,
an RPC API is simpler and more powerful than REST/GraphQL.





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
> - One way to think about RPC is that's it is like any other programming library &mdash; it's just called remotaly instead of locally but all the programming paradigms you cherish and learned programming can be applied to RPC.
