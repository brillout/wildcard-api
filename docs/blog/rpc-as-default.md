## RPC as Default

Today,
REST and GraphQL are the default choice to create an API.
[RPC](/docs/what-is-rpc.md#what-is-rpc)
is rarely considered as the default choice.

For a large project with many developers and especially many third-party developers,
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
and progressively replace your API endpoints with your newly created RESTful/GraphQL API.

Deciding whether to use REST or GraphQL for an architecture that doesn't exist yet is difficult at best, if not impossible.
RPC enables you to deliver and evolve an MVP
while progressively gathering information about the requirements of your business before deciding between REST and GraphQL.

With RPC,
you can get to your seed funding round faster
and, as you rise your series A and hire more developers,
you progressively replace RPC with REST or GraphQL.

In short,
use RPC as default.

For a Node.js server you can use
[Wildcard API](https://github.com/reframejs/wildcard-api)
and for other server frameworks we recommand to simply implement custom server routes with JSON serialization.
