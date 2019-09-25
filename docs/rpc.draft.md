# RPC vs REST/GraphQL

In this document, we illustrate the differences between RPC and REST/GraphQL in the context of web development.

> **TL;DR**
> - RPC is schemaless whereas REST/GraphQL has a schema.
> - A schema is about decoupling frontend and backend.
> - For a frontend and a backend developed hand-in-hand, RPC is simpler and more powerful.

- [What is RPC]()
- [Schema vs Schemaless]()
- [Example where RPC is the best choice]()
- [Example where GraphQL/REST is the best choice]()
- [Conclusion]()

### What is RPC

The [Wikipedia RPC article](https://en.wikipedia.org/wiki/Remote_procedure_call) explains RPC quite well:

> [...] A remote procedure call (RPC) is when a computer program causes a procedure [...] to execute [...] on another computer on a shared network [...], which is coded as if it were a normal (local) procedure call, without the programmer explicitly coding the details for the remote interaction. That is, the programmer writes essentially the same code whether the subroutine is local to the executing program, or remote. This is a form of client–server interaction (caller is client, executor is server), typically implemented via a request–response message-passing system.

For example with Wildcard:

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

The fundamental difference between RPC and REST/GraphQL is that
RPC is schemaless and SQL/ORM queries are used directly whereas REST/GraphQL uses a schema that essentially proxies SQL/ORM queries.

For example, a RESTful API would have a schema model `todo` with following operations:
- `HTTP POST https://example.org/api/todo` to **C**reate new todo item
- `HTTP GET https://example.org/api/todo/{id}` to **R**ead a todo item with the id `{id}`
- `HTTP PUT https://example.org/api/todo/{id}` to **U**pdate a todo item with the id `{id}`
- `HTTP DELETE https://example.org/api/todo/{id}` to **D**elete to delete a todo item with the id `{id}`

The frontend can use one of these operations to retrieve/mutate a todo item.
For example to create a new todo:

~~~js
// Browser

const fetch

fetch({
  url:
  method: 'POST',
});
~~~

The interface for the frontend are these operations; the SQL/ORM queries are done by the RESTful API and hidden from the frontend developer.

With RPC, we don't have any schema model `todo`, instead we use SQL/ORM queries directly:

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

The benefits of using RPC the schemaless aproach of RPC is that is simpler:
we use SQL/ORM queries directly and we don't have to set up a schema with CRUD operations.
It is also more powerful as we can use any SQL/ORM query while developing the frontend. For example:

~~~js
//
endpoints.setAllTodosAsCompleted = async function({text}) {

  return newTodo;
};
~~~

is and very inefficient as you'd need to call the create operation `HTTP POST https://example.org/api/todo` for each todo item.

Being able to use any SQL query is vastly more powerful than CRUD operations.

But, anytime the frontend wants to use a new or change a SQL/ORM query, the backend codes need to be changed.
For example:

REST/GraphQL, on the other hand, enables the frontend to use CRUD operations on each model without requiring any modification to the backend code: frontend can be developed independently of the bakend development.


To recap, the schemaless approach of RPC is simpler and more powerful whereas the schema approach of REST/GraphQL decouples frontend and backend.







What is the benefit of a REST/GraphQL schema?

The schema enables the frontend with CRUD operations on each model.
The key aspect here.
Beforehand
a ge

In essence, the schema (and in general any generic API) decouples frontend and backend:
The frontend can be devloped independently of the backend.

The downside of the schema is that it takes time to develop

The purpose is to enable the API consumer to be able to
without modifying the backend and its API.

of a schema is to create a generic API:
an API that is able to fulfill all kinds of data requirements,
independently of what the frontend needs.

Such generic API makes a lot of sense when the backend and its API are set in stone:
the backend needs to support the frontend with whatever frontend may eventually need;
the more generic the API the better.


With RPC,
we do the opposite:
we develop the API and the frontend hand-in-hand and create and evolve endpoints progressively as the frontend needs arise.

So, when we develop API and frontend hand-in-hand we don't need REST, GraphQL, nor any API schema.



In a sense, a API schema makes things more rigid.
That is certainly a good thing from the perspective of a thrid party that
needs a long term contract.

Not only don't we need to duplicate the schema, but it actually it also get's in the way of quickly evolving our app.
Every time we need change our models we have to change it in two places: the database itslef and the API schema.
Duplicated

Is it wasteful, this indirection makes sense when the API is set in stone.
Thanks to the schema and its CRUD operation without changing the API backbone.
The backend and its API is set in stone.


If your goal is to create an API that is
- Rigid and set in stone
- Consumed by many 
- Developed independently

But if your goal is to create an API that is:
- Simple, quick, and easy
- Evolves hand-in-hand with your frontend


This makes sense for an API that is set in stone.
But in our case we don't need:
we develop the API provider (the server) and the API consumer (the frontend)
hand-in-hand allowing us to modify the API each time the frontend needs a change.

This ability to change the API at the whim of the frontend,
is
This is at the core of the decision whether to use RPC or REST/GraphQL.






Each time we change the SQL/ORM queries the frontend uses, we need to modify and re-deploy the backend.
retrieve/mutate we need to change and the backend code.

For web development, whether to use RPC boils down to the following trade-off:
 - Con: Higher frontend - backend coupling
 - Pro: Simpler
 - Pro: More powerful

This means that.

For example,
if your backend is developed by a contractor that will deliver and sign off the backend before the frontend is being developed,
then REST/GraphQL is the way to go;
the backend and the API are set in stone and the frontend needs a generic API.

But if your backend and frontend are developed within the same organization,
and if the backend team is willing to modify the backend's API when the frontend needs a change,
then RPC is most likely the way to go.
The drawback of RPC is that the backend will have to change and re-deploy the API more frequently
but the added simplicity and powerfulness of RPC largely outweighs this drawback.

And,
if you are a single full-stack JavaScript developer writing a prototype,
then Wildcard is superior in virtually every way.

For web dev, we can refine our rule to:
> Do you develop your frontend
For web development
If you need to be able to develop the frontend independently of the backend
then use REST/GrapQL.
Otherwise RPC is simpler and more powerful.
We discuss whether a highter frontend - backend coupling is a good thing in
[Tight frontend - backend development]()

The sc
the reason
? It depends

with REST/GraphQL you first have to define 
and write CRUD resolvers for each model using SQL/ORM queries.






Being able to use any SQL/ORM query to retrieve/muate data is
both more powerful and simpler than REST and GraphQL.

It is also simpler.


This added complexity makes sense for an API that is set in stone:
an API consumer needs to be able to retrieve/mutate data in all kinds of way without requiring the API to change.
Creating a shema and CRUD operations on each model allows exactly that: a generic way to access data wihtout requiring change backend.
It enables the frontend to be developed independently of the backend.
It decouples frontend development from backend development.

In our example,
we develop the frontend hand-in-hand with the backend and we don't require such decoupling:
we can change the API whenever the frontend requires so.

then.
With RPC you skip all that and can use the ORM directly to retrieve/mutate data
1. Define a schema that replicates and reprensetns your database
2. Write CRUD resolvers for all your models
3. Define permission for all your models

What you endpoint 

In contrast, with RPC you:
1. Can use any SQl/ORM query
2. Define permission on case-by-case basis



but for an API that is developed hand-in-hand 

an uncesseray redundancy reflecting your database.
the rigid structure and schema of a RESTful or GraphQL API is not only
an uncesseray indirection but also get's in the way of quickly evolving your app.

If you can afford to develop 

not only vastly simpler and vastly more powerful.
And that by a order of magnitute.
Even if you need only couple of queries
With RPC, you 
In when you set up REST/GrahQL.
We skip 



Not only is it simpler but it is also more powerful than REST/Graphql.
SQL/ORM.
We skip schema and structure.
In a sense, the schema is an uncessary indirection.

But we have made strong assumtion here: we said that the.
This is the 

> RPC is only an option if you are willing to change the API for each consumer.

This is a safe assumption.


To illustrate:

~~~js
// RPC for full-stack JavaScript with Wildcard

endpoints.whateverTheFrontendNeeds = function() {
  // We don't return product.description
};
~~~

If the frontend were to change to require `product.description`.
This is where the power of GraphQL comes in.
That is set in stone
But for an API that can change at the whip of the frontend, RPC is actually more powerful than GraphQL.







### Example where RPC is clearly the best choice

Let's assume that we want to quickly create a prototype for a greenfield project
that consists of one server and one frontend that are developed hand-in-hand and deployed at the same time.

With RPC, the frontend can use any server-side tool to retrieve/mutate data, such as SQL or an ORM:

With RPC we use SQL/ORM queries directly.

The prototype requires only couple of 

1:1 relationship between frontend and backend

Most notably while prototyping.

More powerful; being able to use any SQL/ORM query while developing your frontend is arguably more powerful than any GraphQL query.


But if your API is by 5 frontends,
then using GraphQL can be more fitting.















### Example where GraphQL/REST is clearly the best choice

For example, Facebook uses a GraphQL API to expose its data.
GraphQL is fitting as it enables anyone in the world
to access Facebook's data in all kinds of ways.


### In Between

Are you willing to modify your API?

progressively replace RPC with REST/GraphQL.


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


### Conclusion

Our rule of thumb can be refined with the following:

> Are you willing to change your API each time a API consumer changes its data requirement changes? If yes, use RPC. Otherwise, use REST/GraphQL.



Large organization



Many large companies, such as Google and Netflix,
are starting to replace REST APIs with RPC
for the communication between their internal services.
RPC makes more sense than REST/GraphQL as
both the API consumer

Internal services are consumed only within a company,
no third party access,
and RPC makes most sense.
Most notably,
[gRPC](https://grpc.io/) is getting more and more popular in the industry.

On a high-level Wildcard and gRPC are the same as they both allow you create an RPC API.
gRPC is designed for cross-platform communication,
such as between a Python backend and a Java Backend.
whereas Wildcard
is designed only for the frontend and Node.js.
For a frontend + Node.js stack,
Wildcard is radically simpler and super easy to use.

An API between your React/Vue/Angular frontend and your Node.js server
is essentially an internal API: you are the consumer of your API.
RPC is most fitting choice and you can use Wildcard
to easily create an RPC API.

If you are not sure about RPC,
We recommend familiarizing yourself with RPC
as it plays a fundamental architecural role.
At [RPC Explained](/rpc.md).
we explain RPC and show its benefits and drawbacks.











### RPC Explained

The reason is that with REST / GraphQL you build API endpoints without knowing
who the consumer of your API is and what he needs.
With RPC, you build an API for yourself and you know what endpoints you need.



learning the procedures of a remote API is very similar to learning a new programming library.
