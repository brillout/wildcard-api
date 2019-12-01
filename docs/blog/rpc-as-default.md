## RPC as Default

Today,
REST and GraphQL are the default choice to create an API.
[RPC](/docs/what-is-rpc.md#what-is-rpc)
is rarely considered.

For a large project with many (third-party) developers,
deciding only between REST and GraphQL
makes sense:
you need a structured API and RPC's schemaless nature is no fit.

But,
for a prototype that needs only few API endpoints,
you don't really need REST or GraphQL &mdash; RPC is enough.

If you are startup and you want to ship an MVP as quickly as possible,
time-to-market is precious and researching about REST or GraphQL
has a high cost in time.

RPC enables you to postpone the "REST or GraphQL" decision.
You can start with RPC today and,
as you scale and as the need for a structured API arises,
you create a RESTful or GraphQL API
and progressively replace your API endpoints with your newly created RESTful/GraphQL API.

Deciding whether to use REST or GraphQL for an architecture that doesn't exist yet is difficult at best, if not impossible.
RPC enables you to first build your MVP
and gather information about what kind of application stack your business needs before deciding between REST and GraphQL.

With RPC,
you can get to your seed funding round faster
and, as you rise your series A and hire more developers,
you progressively replace RPC with REST or GraphQL.

In short,
use RPC as default.

RPC tools:
- [JavaScript] [Wildcard API]()
- Is an RPC tool missing? Create a pull request.

(Note that [gRPC](https://grpc.io/) is better suited for microservices and less suited for backend APIs.)


