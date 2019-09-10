For example, Facebook uses a GraphQL API to expose its data.
GraphQL is fitting as it enables anyone in the world
to access Facebook's data in all kinds of ways.

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

-API consumed by third parties?
-More precisely are you willing to change your API?

The reason is that with REST / GraphQL you build API endpoints without knowing
who the consumer of your API is and what he needs.
With RPC, you build an API for yourself and you know what endpoints you need.


