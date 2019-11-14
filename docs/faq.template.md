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
!VAR|LINK MORE_POWER
!VAR|LINK TIGHT_COUPLING
!VAR|LINK SYNC_DEPLOY
!VAR|LINK SYNC_DEV
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












As discussed in the previous section,
RPC tightly couples frontend and backend in the sense that it increases frontend deployement deployement on the backend.
But that's it:

The time were desginers would by write HTML, and CSS are over.

Such modern Frontend Engineer is amply capable of writing SQL/ORM queries.
In a full-stack JavaScript monorepo

don't make sense for a modern frontend

that is mostly static and non-interactive.

But for a modern interactive frontend

- The API endpoint functions developed by the frontend developers.
- The rest developed by the backend developers.

Separation of concerns should not happen on a technology basis.
It should happen on a *concern* basis.
In the old days people :
- The frontend team. would be concerned about the aesthetics
- The backend team.

But now.

The API consumer is mostly likely a Software Engineer who writes JavaScript and who is amply capable of writing backend code and writing SQL/ORM queries.
For such an Engineer, the frontend-backend separation doesn't make sense.
That's why most JavaScript developers are full-stack developers.
If you are able to implement the frontend complex web apps then you are very much able to implement complex backends.

The concerns of a backend with a modern frontend are:
- View Aesthetics (mostly CSS)
- Frontend Business Logic (mostly JavaScript/React/Vue/API, frontend+backend!)
- Backend Business Logic (backend)

While in theory it would be possible to let designers write CSS it is for feasable in practice (for reasons that are out of the scope) and we end up with JavaScript Engineers that write the view logic as well as CSS.

And that makes sense for trivial frontend that consists of mainly HTML/CSS which was the vast majority of frontend 10 years ago. Frontend uses to be developed by designers that would write HTML/CSS.
But nowadays, this old dichotomy does hold anymore. Many frontend involve complex business logic with complex interactive views with intricated state management.

We recommend to put all frontend and backend code in the same repository which we talk more about in the next section.




The development itself


Focus on backend


A custom API works only when developed hand-in-hand with the frontend.

Is tight coupling a bad thing?

There are two aspects about tight coupling:
- Deployment
- Development

Back in the days when continous deployment wasn't common, tightly coupling backend and frontend was considered bad practice.
This made sense since you had to wait weeks before the next version of the backend and frontend was deployed.
Tightly coupling frontend and backend meant that the deployemnet had to happen at the same time.

But things are different today. Continous deployment is now wildely accepted as the way to go.

!INLINE ./snippets/section-footer.md #contents --hide-source-path




make ensure
Monorepos are convenient
and they hold many advantages cross-change can be a single commit ensure the correct dependency
Putting services that are deployed 
More and more

They have many advantages 
you always know the dependency codebase depends.

More monorepo strategy: code lives in a single repository but deployed deploy to sever
the ease of a single codebase and scability of micro-services.

In a monoreploy deploy at the same time.

Even if you'd use REST or GraphQL your frontend and backend aren't indepedent and.
It just that with RPC has more frequent API changes.
- example RPC API chagne
- example REST/GraphQL API change

(In general, anytime the frontend needs a change in the API
and if have situations.

, when using RPC, it's best to deploy your frontend and backend at the same time.

!INLINE ./snippets/section-footer.md #faq --hide-source-path








But the considered way to go and common practice.
Systems are nowadays deployed several times a day. This makes tighly coupling not a problem.

Seperation of concerns by business logic and not by technology.
It is tempting to think. 

And especially.

Is easy, as explained in


You may think "Ok yes I can deploy 

Like React says: don't modularize by technologie but modularize by.

Modularizing 
Modularizing 

That's precisely the reason why,
if you want your API is to be consumed by third parties,
you should use REST or GraphQL instead of RPC.

!INLINE ./snippets/section-footer.md #faq --hide-source-path









!VAR OLD RPC is old, why is it being used again?

### !VAR OLD

Wildcard is basically
[RPC](/docs/rpc.md#what-is-rpc)
between your browser frontend and your Node.js server.

RPC existed long before REST.
(Xerox PARC being among the first to implement RPC in the early 1980s
while REST was introduced only in the early 2000s.)

So, why should one use RPC instead of REST/GraphQL today?

When REST came out,
it allowed internet companies
to expose their data
to third parties in a safe and standardized way.
Large companies
soon realized the potential:
a RESTful API
allowed them
to become platforms with
a flurishing ecosystem
of third-party applications built on top of their RESTful API.
REST soon became the de facto standard for public APIs.

GraphQL is a great step forward:
it allows third parties to retrieve data that were previously difficult (or even not possible) to retrieve with a RESTful API.
GraphQL allows for a even more prospereous ecosystem of third-party applications.
Large companies,
such as Facebook and GitHub,
now expose their data as a GraphQL API,
reinforcing their position as a platform.

If you want to enable an ecosystem of third-party applications built on top of your data,
then setting up a RESTful/GraphQL API
is an obligatory step.

This is not RPC's use case.
An API created with RPC is meant to be consumed by your clients and your clients only.
If your goal is simply to retrieve/mutate data from your frontend,
then RPC
offers a simple and powerful alternative.

The advent of REST and GraphQL
spur the rise of vast ecosystems of third-party apps.
That's wonderful.
But sadly,
their success casted a shadow over RPC,
even though RPC is (and always was) a great way of communicating between two remote processes.

!INLINE ./snippets/section-footer.md #faq --hide-source-path



