!INLINE ./header.md --hide-source-path

!VAR COMPARISON How does RPC compare to GraphQL/REST?
!VAR POWER Which is more powerful, GraphQL or RPC?

!VAR DEPLOY Should I develop frontend and backend hand-in-hand?
!VAR DEPLOY Should I deploy frontend and backend at the same time?
!VAR VERSIONING How can I do versioning?
!VAR TIGHT_COUPLING Doesn't RPC tightly couple frontend with backend?

!VAR OLD RPC is old, why is it being used again?

&nbsp;

# FAQ

###### High-level
!VAR|LINK COMPARISON
!VAR|LINK POWER

###### Low-level
!VAR|LINK DEPLOY
!VAR|LINK VERSIONING
!VAR|LINK TIGHT_COUPLING

###### Curiosity
!VAR|LINK OLD

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



### !VAR POWER

Yes and no.

From the perspective of a third party,
yes,
GraphQL is more powerful.

But,
from the perspective of your frontend development,
things are different.

While developing your frontend,
everything the backend can do is only one JavaScript function away:

~~~js
// Your Node.js server

const endpoints = require('wildcard-api');

endpoints.iHavePower = function() {
  // I can do anything the Node.js server can do
};
~~~
~~~js
// Your browser frontend

const endpoints = require('wildcard-api/client');

// The backend power is one JavaScript function away
endpoints.iHavePower();
~~~

The whole power of your backend is at your disposal while developing your frontend.
For example,
you can use any SQL/ORM query to retrieve and mutate data.
That's arguably more powerful than GraphQL.

The distinctive difference is that,
from the perspective of a third party,
your API is set in stone
but,
from your perspective,
your API can be modified at will while developing your frontend.

!INLINE ./snippets/section-footer.md #faq --hide-source-path



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



### !VAR DEPLOY

Yes, when using RPC, it's best to deploy your frontend and backend at the same time.

In a full-stack JavaScript setup,
this can easily be achieved by using a full-stack monorepo and deploying the frontend through the backend:

~~~js
// Our backend
const express = require('express');
const server = express();

// We serve our frontend assets (HTML, CSS, JS, images, etc.) with our backend:
server.use(express.static('/path/to/your/browser/assets/dist/', {extensions: ['html']}));
~~~

This ensures that frontend and backend are deployed hand-in-hand.

!INLINE ./snippets/section-footer.md #faq --hide-source-path




### !VAR VERSIONING

Don't do versioning,
instead deploy your frontend and backend at the same time as described. You then don't need versioning as the backend always only serves a single version of the API.

In a full-stack JavaScript setup, this can be easily achieved as described in
!VAR|LINK DEPLOY.

!INLINE ./snippets/section-footer.md #faq --hide-source-path


### !VAR TIGHT_COUPLING

Yes, RPC tightly couples frontend with backend. (We explain)

But that's okay.

Back in the days when continous deployment wasn't common, tightly coupling backend and frontend was considered bad practice.
This made sense since you had to wait weeks before the next version of the backend and frontend was deployed.
Tightly coupling frontend and backend meant that the deployemnet had to happen at the same time.

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
