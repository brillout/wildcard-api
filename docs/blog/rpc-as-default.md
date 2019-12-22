## RPC as Default

Most web developers use
REST or GraphQL
to create a backend API;
they rarely consider
[RPC](/docs/what-is-rpc.md#what-is-rpc).
For most web developers the default is REST or GraphQL.

For a large project
If your goal is to create an API
for a large project that will be used by a high number of developers and a high number of third-party developers
then ignoring RPC makes sense:
you need an API that has structure and RPC's schemaless nature is no fit.
For example, Facebook's API is used by ~200k third parties and RPC is not an option.

REST or GraphQL make sense for large projects
but for small to medium-sized apps, and especially prototypes,
you most often don't need REST nor GraphQL &mdash; RPC is enough.
Not only is RPC enough but it also allows you to quickly deliver and evolve an MVP.

Deciding whether to use REST or GraphQL for an application that does not yet exist [is difficult](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer).
RPC enables you to postpone the "REST or GraphQL" decision:
you implement your prototype with RPC at first and later,
as your MVP scales to a mature application,
it will become clearer and easier to decide
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

