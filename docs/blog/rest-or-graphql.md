# REST or GraphQL? A simple answer.

Whether REST or GraphQL better fits your application depends on many factors:
do you need third parties to be able to access your data?
What are third parties doing with your data?
Is your stack statically typed?
Does your team have experience with GraphQL?
Does your language environment have good GraphQL support?
And so on and so forth.

Deciding whether to use REST or GraphQL for an application that does not yet exist is difficult at best, if not impossible.
For example,
in the context of a startup,
the requirements of your app may drastically change as your startup pivots and evolves making it unfeasible to reliably predict whether REST or GraphQL is the right choice.

A solution is to use [RPC](/docs/what-is-rpc.md#what-is-rpc):
instead of REST or GraphQL:
you implement your prototype with RPC at first and later,
as your prototype scales to a stable application,
it will become much clearer and much easier to decide
whether either REST or GraphQL best fits your application.
You then progressively replace your RPC endpoints with your newly created RESTful or GraphQL API.

It may also happen that you won't even need REST nor GraphQL:
RPC is often enough for small to medium-sized applications.

In short,
use [RPC as default](/docs/blog/rpc-as-default.md#rpc-as-default) and
switch to REST or GraphQL when and if the need arises.

