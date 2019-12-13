## RPC as Default

In order to create a backend API,
web developers
usually go with REST or GraphQL by default &mdash;
they rarely consider
[RPC](/docs/what-is-rpc.md#what-is-rpc).

If your goal is to build an API
for a large project used by a high number of developers and a high number of third-party developers
then ignoring RPC makes sense:
you need an API that has structure and RPC's schemaless nature is no fit.
For example, Facebook's API is used by ~200k third parties and RPC is not an option.

But,
for a prototype that needs only few API endpoints,
you don't need REST nor GraphQL &mdash; RPC is enough.
Not only is RPC enough but it also allows you to quickly deliver and evolve your MVP.

Deciding whether to use REST or GraphQL for an application that does not yet exist [is difficult](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer).
RPC enables you to postpone the "REST or GraphQL" decision:
you implement your prototype with RPC at first and later,
as your MVP scales to a stable application,
it will become much clearer and much easier to decide
whether either REST or GraphQL best fits your application.
You then progressively replace your RPC endpoints with your newly created RESTful/GraphQL API.

It may also happen that you won't even need REST nor GraphQL:
RPC is often enough for small to medium-sized applications.

If you are startup,
you can use RPC to
faster get to your seed funding round
and,
as you rise your series A and hire more developers,
you can progressively replace RPC with REST or GraphQL.

In short,
use RPC
(or [RPC-like](/docs/blog/rest-rpc.md#rpc-like))
as default.

For a Node.js backend you can use RPC with
[Wildcard API](https://github.com/reframejs/wildcard-api#readme)
and for other server environments
you can use RPC-like [custom JSON endpoints](/docs/blog/rest-rpc.md#custom-json-endpoints).

