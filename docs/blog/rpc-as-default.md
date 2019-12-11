## RPC as Default

In order to create a backend API,
web developers
usually go with REST or GraphQL by default &mdash;
they rarely consider
[RPC](/docs/what-is-rpc.md#what-is-rpc).

If your goal is to build an API
for a large project used by a high number of developers and a high number of third-party developers
then ignoring RPC is fine:
you need an API that has structure and RPC's schemaless nature is no fit.
For example, Facebook's API is used by ~200k third parties and RPC is not an option.

But,
for a prototype that needs only few API endpoints,
you don't need REST nor GraphQL &mdash; RPC is enough.
Not only is RPC enough but it also allows you to quickly deliver an MVP.

Deciding whether to use REST or GraphQL for an application that does not yet exist [is difficult](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer).

RPC enables you to postpone the "REST or GraphQL" decision.
You can start with RPC to
quickly deliver and evolve your MVP and
gather information about your business' requirements.
As you scale and if the need for a structured API arises,
you create a RESTful or GraphQL API
and progressively replace your RPC endpoints with your newly created RESTful/GraphQL API.

As your prototype scales to a stable application,
it will become much clearer and much easier to decide
whether RPC is enough and,
if not,
whether either REST or GraphQL best fits your application.

If you are startup,
you can use RPC to
get to your seed funding round faster
and,
as you rise your series A and hire more developers,
you can progressively replace RPC with REST or GraphQL,
if the need for a more structured API arises.

In short,
use RPC
(or [RPC-like](/docs/blog/rest-rpc.md#rpc-like))
as default.

For a Node.js backend you can use RPC by using
[Wildcard API](https://github.com/reframejs/wildcard-api#readme)
and for other server environments
you can use RPC-like [custom JSON endpoints](/docs/blog/rest-rpc.md#custom-json-endpoints).

