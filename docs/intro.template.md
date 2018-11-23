!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path
!MENU

Goals:
 1. JavaScript library to make the **creation of a custom API super easy**.
 2. Debunk the **common misconception that a generic API is a silver bullet**.
    A generic API, such as REST or GraphQL, is great for third party clients and large applications
    but is an **unecessary burden for prototypes and medium-sized applications**.

With Wildcard,
**creating an API endpoint is as easy as creating a JavaScript function**:

~~~js
// Node.js Server

const {endpoints} = require('wildcard-api');

// We define a `hello` function on the server
endpoints.hello = function(name) {
  return {message: 'Hi '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  // Wildcard makes our `hello` function available in the browser
  const {message} = await endpoints.hello('Alice');
  console.log(message); // Prints `Hi Alice`
})();
~~~

That's the only thing Wildcard does:
It makes functions defined on the server "callable" in the browser.
That's it.
Wildcard takes care of HTTP request and serialization.
How you retrieve/mutate data is up to you:
You can use SQL, ORM, NoSQL, etc.

#### Contents

 - [Why Wildcard](#why-wildcard)
 - [Example](#example)
 - [Wildcard vs GraphQL/REST](#wildcard-vs-graphqlrest)
 - [Quick Start](#quick-start)


<br/>

### Why Wildcard

With Wildcard you
**retrieve/mutate data from the frontend in a seamless way**:
No schema,
no permission rules,
just create functions on `endpoints`.

These endpoint functions effectively act as fine-grained "permission holes".
This is a simple alternative to permission rules.

Wildcard's simplicity is **ideal to quickly deliver a protoype**:
Write the couple of SQL/ORM/NoSQL queries your prototype's frontend needs,
wrap them in endpoint functions,
and you're good to go.

The **structureless nature of a custom API is a good fit for rapid prototyping**
whereas the rigid structure of a generic API's schema
gets in the way of quickly evolving your prototype.

That said, a custom API (and thus Wildcard) is not suitable for:
 - Third party clients. (A generic API is inherently required.)
 - Large applications with a frontend development decoupled from API development.

To make the developing experience further seamless,
Wildcard provides:
 - **Zero setup**.
   <br/>
   Set up a Wildcard API with only couple of lines.
   Works with any server framework: Express, Koa, Hapi, etc.
 - **Error handling**.
   <br/>
   Using [Handli](https://github.com/brillout/handli) to automatically handle network corner cases,
   such as when the user looses his internet connection.
   (You can implement your own error handling.)
 - **Extended serialization**.
   <br/>
   Using [JSON-S](https://github.com/brillout/json-s) to support further JavaScript types.
   (Such as `Date` which JSON doesn't support.)
 - **Universal / Isomorphic / SSR support**.
   <br/>
   The Wildcard client works in the browser as well as on Node.js.
   With seamless support for
   server-side rendering.

!INLINE ./snippets/intro-section-footer.md --hide-source-path



## Example

View endpoints of a simple todo app:

~~~js
!INLINE ../example/api/view-endpoints --hide-source-path
~~~

Wildcard can be used with any server framework such as Express, Hapi, Koa, etc.
In our example we use Express:

~~~js
!INLINE ../example/start --hide-source-path
~~~

At [Example](/example/#readme)
we further showcase our toto app,
including mutation endpoints,
and a React frontend.


!INLINE ./snippets/intro-section-footer.md --hide-source-path






## Wildcard vs GraphQL/REST

Comparing Wildcard with REST and GraphQL mostly boilds down to comparing a custom API with a generic API.

With "custom API" we denote an API that is designed to fulfill only the data requirements of your clients.
E.g.:
<br/> &nbsp; &nbsp; &bull; &nbsp; Wildcard API
<br/> &nbsp; &nbsp; &bull; &nbsp; API with [REST level 0](https://martinfowler.com/articles/richardsonMaturityModel.html#level0)

With "generic API" we denote an API that is designed to support a maximum number of data requirements.
E.g.:
<br/> &nbsp; &nbsp; &bull; &nbsp; GraphQL API
<br/> &nbsp; &nbsp; &bull; &nbsp; API with [REST level >=1](https://martinfowler.com/articles/richardsonMaturityModel.html#level1)

We explore use cases for custom APIs and for generic APIs at
[Usage Manual - Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api)
.

!INLINE ./snippets/intro-section-footer.md --hide-source-path









## Quick Start

Work-in-progress.

!INLINE ./snippets/intro-section-footer.md --hide-source-path




