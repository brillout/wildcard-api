# RPC or REST/GraphQL, which one to use?

An approximate rule of thumb:
- Is your API consumed by third parties? Use REST/GraphQL.
- Is your API consumed by yourself? Use REST/GraphQL.

This document illustrates this rule.

- []
- []
- []
- [Conclusion]


### Example where RPC is clearly the best choice

Let's assume that we want to quickly create a prototype for a greenfield project
that consists of a server with a frontend that are developed hand-in-hand and deployed at the same time.

With RPC,
While developing the frontend with RPC,
anything the server
all the server's power
can be used
you can write any function you want
to retrieve/mutate data:
anything the server can do is one endpoint away:

~~~js
// Assuming that the backend is a Node.js server
// and the frontend is a web frontend (React/Vue/Angular/...).
// we can then use Wildcard.

const {endpoints} = require('wildcard-api');

prototype with full-stack JavaScript (Node.js Server + React/Vue/Angular/... Frontend) prototype for a greenfield project.

endpoints.whateverTheFrontendNeeds = function(productId) {
  // 
  // Depending
  if( !productId || productId.constructor===Number ){
    return;
  }

  // In Here we can do whatever
  // In short, we can use the full server power for our frontend.
};
~~~

Because the frontend and backend are developed
hand-in-hand,
we can write our endpoint 
While developing you can write any SQL/ORM query you want to retrieve/mutate data from the frontend.

Being able to use SQL/ORM is arguably more powerful than REST/GraphQL queries.

This is much simpler than setting up
In when you set up REST/GrahQL.

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


