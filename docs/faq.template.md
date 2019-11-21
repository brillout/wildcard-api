!INLINE ./header.md --hide-source-path

!VAR COMPARISON How does RPC compare to GraphQL/REST?
!VAR MORE_POWER Which is more powerful, GraphQL or RPC?
!VAR TIGHT_COUPLING Doesn't RPC tightly couple frontend with backend?
!VAR SYNC_DEPLOY Should I deploy frontend and backend at the same time?
!VAR SYNC_DEV Should I develop frontend and backend hand-in-hand?
!VAR VERSIONING How can I do versioning?

&nbsp;

# FAQ

!VAR|LINK COMPARISON
<br/>
!VAR|LINK MORE_POWER
<br/>
!VAR|LINK TIGHT_COUPLING
<br/>
!VAR|LINK SYNC_DEPLOY
<br/>
!VAR|LINK SYNC_DEV
<br/>
!VAR|LINK VERSIONING

<br/>

### !VAR COMPARISON

They have different goals.

With GraphQL/REST you create a *generic API*:
an API that aims to be able to fulfill a maximum number of data requirements;
enabling third parties to build applications on top of your data.
If your goal is to have an ecosystem of third-party applications,
then you need a generic API and you'll have to use something like REST/GraphQL.

With RPC you create a *custom API*:
an API that fulfills the data requirements of your clients and your clients only.
If your goal is to retrieve and mutate data from your frontend,
then Wildcard offers a simple alternative.

We explain this in more depth at
[RPC vs REST/GraphQL](/docs/rpc-vs-rest-graphql.md#rpc-vs-restgraphql).

!INLINE ./snippets/section-footer.md #faq --hide-source-path



### !VAR MORE_POWER

Depends.

From the perspective of a third party,
GraphQL is more powerful.

From the perspective of frontend development,
RPC is more powerful.

With Wildcard,
while developing the frontend,
everything the backend can do is only one JavaScript function away:

~~~js
// Your Node.js server

const endpoints = require('wildcard-api');

endpoints.iHavePower = function() {
  // I can do everything the Node.js server can do
};
~~~
~~~js
// Your browser frontend

const endpoints = require('wildcard-api/client');

// The backend power is one JavaScript function away
endpoints.iHavePower();
~~~

The whole power of the backend is at disposal while developing the frontend.
For example,
any SQL/ORM query can be used to retrieve and mutate data.
That's arguably more powerful than GraphQL.

The distinctive difference is that,
from the perspective of a third party,
the API is set in stone
but,
from the frontend development perspective,
the API can be modified at will.
(Note that RPC assumes that the API can be modified and re-deployed at the whim of the frontend development,
which we talk about at !VAR|LINK SYNC_DEPLOY)

!INLINE ./snippets/section-footer.md #faq --hide-source-path



### !VAR TIGHT_COUPLING

Yes it does.
RPC indeed induces a tighter coupling between frontend and backend.
More precisely, RPC increases the need for synchronized frontend-backend deployements.

For example:

~~~js
// This API endpoint is tightly coupled to the frontend:
// it returns exactly (and only) what the landing page needs.
endpoints.getLandingPageData = async function() {
  const user = await getLoggedUser(this.headers);
  if( !user ){
    return {isNotLoggedIn: true};
  }
  const todos = await db.query('SELECT id, text FROM todos WHERE authorId = ${user.id};');
  return {user, todos};
};
~~~

If changes are made to the frontend that require the todo items' creation,
then the SQL query of the `getLandingPageData` API endpoint needs to be changed from `SELECT id, text FROM` to `SELECT id, text, created_at FROM`.
This means that the API needs to be modified and the backend re-deployed.

In general (and regardless whether you use RPC or REST/GraphQL)
we recommand to synchronize your backend and frontend deployment.
Which we talk about in the next querstion
!VAR|LINK SYNC_DEPLOY.

!INLINE ./snippets/section-footer.md #faq --hide-source-path



### !VAR SYNC_DEPLOY

Yes, we recommend synchronized deployements, that is to deploy frontend and backend at the same time.

We also recommend to put the frontend and backend code a monorepo.
(A monorepo is a repository that holds the codebase of all different components of a system, instead of having a multitude of repositories each holding the codebase of a single component.
Monorepos are increasingly popular; it makes it easy to perform changes across system components and removes the need to manage dependency between system components.)

A monorepo with synchronized deployment setup
lends itself well in a full-stack JavaScript app. For example:

~~~js
// Our backend's Node.js server
const express = require('express');
const server = express();

// We serve and deploy our frontend over the Node.js server:
server.use(express.static('/path/to/frontend/dist/'));
~~~

This ensures that frontend and backend are always deployed synchronously.
The backends serves only one API version and the served API is always the correct one.

!INLINE ./snippets/section-footer.md #faq --hide-source-path



### !VAR SYNC_DEV

You can, but you don't have to.

Although,
since more and more frontend engineers are full-stack engineers,
it makes sense to hire full-stack engineers and develop frontend and backend hand-in-hand.

You can still have separation of concerns:
- Backend code concerned about the frontend, which includes the API endpoints that run SQL/ORM queries on behalf of the frontend, is developed by frontend developers.
- The rest of the backend, that is agnostic to the frontend, is developed by backend developers.

The strict separation between browser-side code and server-side code makes less and less sense.
Nowadays, most frontend engineers are comfortable and eager to write server-side code.
To a full-stack engineer, RPC is a boon:
it gives him the power to use any SQL/ORM query and any server-side tool he wants.

!INLINE ./snippets/section-footer.md #faq --hide-source-path



### !VAR VERSIONING

As explained in
!VAR|LINK SYNC_DEPLOY,
we recommend to deploy frontend and backend synchronously.
You then don't need
versioning: the backend always serves a single version (the correct one) of the API.

!INLINE ./snippets/section-footer.md #faq --hide-source-path



