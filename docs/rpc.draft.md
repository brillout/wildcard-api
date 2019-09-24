# RPC or REST/GraphQL, which one to use?

In this document,
we illustrate the following rule of thumb:
- Is your API consumed by third parties? Use REST/GraphQL.
- Is your API consumed by yourself? Use REST/GraphQL.

- [Example where RPC is clearly the best choice]()
- [Example where GraphQL/REST is clearly the best choice]()
- [In Between]()
- [Tight frontend - backend development]()
- [Conclusion]()


### Example where RPC is clearly the best choice

Let's assume that we want to quickly create a prototype for a greenfield project
that consists of one server and one frontend that are developed hand-in-hand and deployed at the same time.

With RPC, the frontend can use any server-side tool to retrieve/mutate data, such as SQL or an ORM:

~~~js
// Assuming that the backend is a Node.js server
// and the frontend is a web frontend (React/Vue/Angular/...).
// we can then use Wildcard.

const {endpoints} = require('wildcard-api');

prototype with full-stack JavaScript (Node.js Server + React/Vue/Angular/... Frontend) prototype for a greenfield project.

endpoints.whateverTheFrontendNeeds = function(productId) {
  // Depending
  if( !productId || productId.constructor===Number ){
    return;
  }

  // In Here we can do whatever
  // In short, we can use the full server power for our frontend.
};
~~~

With RPC we use SQL/ORM queries directly.

With REST/GraphQL we would need to define a schema that replicates the models of your database
and you write CRUD resolvers using SQL/ORM for each model REST/GraphQL schema.

Is it wasteful, this indirection makes sense when the API is set in stone.
Thanks to the schema and its CRUD operation without changing the API backbone.
The backend and its API is set in stone.

Each time we change the SQL/ORM queries the frontend uses, we need to modify and re-deploy the backend.
retrieve/mutate we need to change and the backend code.

For web development, whether to use RPC boils down to the following trade-off:
 - Con: Higher frontend - backend coupling
 - Pro: Simpler
 - Pro: Powerful

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

lean and more case-by-case 

for CRUD operations for each model;
You bascically create a generic API.
This redudant 

This makes sense for an API that is set in stone.
But in our case we don't need:
we develop the API provider (the server) and the API consumer (the frontend)
hand-in-hand allowing us to modify the API each time the frontend needs a change.

This ability to change the API at the whim of the frontend,
is
This is at the core of the decision whether to use RPC or REST/GraphQL.


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


But if your API is by 5 frontends,
then using GraphQL can be more fitting.

(in the end GraphQL/REST 
While develop

We can develop hand-in-hand and .

We assume


Because 

write SQL/ORM queries 

The prototype requires only couple of 

1:1 relationship between frontend and backend

Most notably while prototyping.

More powerful; being able to use any SQL/ORM query while developing your frontend is arguably more powerful than any GraphQL query.


### Example where GraphQL/REST is clearly the best choice

For example, Facebook uses a GraphQL API to expose its data.
GraphQL is fitting as it enables anyone in the world
to access Facebook's data in all kinds of ways.


### In Between

Are you willing to modify your API?

progressively replace RPC with REST/GraphQL.

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


