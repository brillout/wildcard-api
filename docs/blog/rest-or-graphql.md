# REST or GraphQL? A simple answer.

Whether REST or GraphQL is the right tool for your app depends on many things:
will third parties use your API?
What will third parties do with your API?
Does your language environment have good GraphQL tools?
Is your team proficient with GraphQL?
Etc.

Deciding whether to use REST or GraphQL for an application that does not yet exist is difficult at best, if not impossible.
In the context of a startup,
for example,
the requirements of your app may drastically change as your startup evolves and pivots,
making it unfeasible to reliably predict whether REST or GraphQL is the right choice.

A solution is to use [RPC](/docs/what-is-rpc.md#what-is-rpc):
you implement your prototype with RPC at first and later,
as your MVP scales to a mature application,
it will become clearer and easier to decide
whether either REST or GraphQL best fits your application.
You then progressively replace your RPC endpoints with your newly created RESTful or GraphQL API.

It may also happen that you won't even need REST nor GraphQL:
RPC is often enough for small to medium-sized applications.

In short,
use [RPC as default](/docs/blog/rpc-as-default.md#rpc-as-default) and
switch to REST or GraphQL when and only if the need arises.

For a Node.js backend you can use RPC with
[Wildcard API](https://github.com/telefunc/telefunc#readme)
and for other environments
you can use [RPC-like JSON endpoints](/docs/blog/rest-rpc.md#json-endpoints).

