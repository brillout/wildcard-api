## RPC as Default

Today,
REST and GraphQL are the default choice to create an API.
[RPC](/docs/what-is-rpc.md#what-is-rpc)
is rarely considered as the default choice.

For a large project with many developers and many third-party developers,
ignoring RPC makes sense:
you need a structured API and RPC's schemaless nature is no fit.

But,
for a prototype that needs only few API endpoints,
you don't really need REST nor GraphQL &mdash; RPC is enough.

If you are startup and you want to ship an MVP as quickly as possible,
time-to-market is precious and researching whether REST or GraphQL
best fits your application
costs time.

RPC enables you to postpone the "REST or GraphQL" decision.
You can start with RPC today and,
as you scale and as the need for a structured API arises,
you create a RESTful or GraphQL API
and progressively replace your RPC endpoints with your newly created RESTful/GraphQL API.

Deciding whether to use REST or GraphQL for an application that does not yet exist [is difficult](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-and-unexpected-answer) at best, if not impossible.
RPC enables you to quickly deliver and evolve an MVP
while progressively gathering information about your business' requirements before deciding between REST and GraphQL.

With RPC,
you can get to your seed funding round faster
and, as you rise your series A and hire more developers,
you progressively replace RPC with REST or GraphQL.

In short,
use RPC (or
[RPC-like](/docs/blog/rest-rpc-custom-endpoints.md#readme))
as default.

For JavaScript and Node.js you can use the RPC implementation
[Wildcard API](https://github.com/reframejs/wildcard-api#readme)
and for other server frameworks
you can use RPC-like [custom JSON endpoints](/docs/blog/rest-rpc-custom-endpoints.md#custom-json-endpoints).

