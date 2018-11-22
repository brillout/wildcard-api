!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path
!MENU

Goals:
 1. JavaScript library to make the creation of a custom API super easy.
 2. Debunk the common misconception that a generic API is a silver bullet.
    A generic API, such as a RESTful API or GraphQL API, is great for third party clients and large applications
    but is an unecessary burden for prototypes and medium-sized applications.

With Wildcard,
creating an API endpoint is as easy as creating a JavaScript function:

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
Wildcard takes care of HTTP requests and serialization.
How you retrieve/mutate data is up to you.
You can use SQL, ORM, NoSQL, etc.

#### Contents

 - [Why Wildcard](#why-wildcard)
 - [Example](#example)
 - [Quick Start](#quick-start)


<br/>

### Why Wildcard

Wildcard makes
retrieving/mutating data from the frontend a seamless experience:
No schema,
no permission rules,
just create functions on `endpoints`.

These endpoint functions effectively act as fine-grained "permission holes".
This is a simple alternative to otherwise complex permissions mechanisms.

To make the experience further seamless,
Wildcard provides:
 - Zero setup.
   <br/>
   Create a Wildcard API with Express, Koa, Hapi, etc. with only couple of lines.
 - Error handling.
   <br/>
   Using [Handli](https://github.com/brillout/handli) to automatically handle network corner cases
   such as when the user looses his internet connection.
   (But you can also provide your own error handling.)
 - Extended serialization.
   <br/>
   Using [JSON-S](https://github.com/brillout/json-s) to support further JavaScript types.
   (Such as `Date` which JSON doesn't support.)
 - Universal/Isomorphic/SSR support.
   <br/>
   The Wildcard client works in the browser as well as on Node.js with seamless support for
   server-side rendering.

Wildcard's simplicity is ideal to quickly deliver a protoype:
Write the couple of SQL/ORM/NoSQL queries your prototype's frontend needs,
wrap them in endpoint functions,
and you're good to go.

The structureless nature of a custom API is a great fit for rapid prototyping
whereas the rigid structure of a generic API's schema and permission rules
gets in the way of evolving your prototype.

That said, a custom API (and thus Wildcard) is not suitable for:
 - Third party clients. (A generic API is inherently required.)
 - Large applications with a frontend development decoupled from API development.

We explore all kinds of different use cases
at
[Wildcard API vs GraphQL/RESTful API](/docs/usage-manual.md#wildcard-api-vs-graphqlrestful-api)
and
[Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api)
.

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

At [Example](/example/)
we further showcase our toto app,
including mutation endpoints,
and a React frontend.


!INLINE ./snippets/intro-section-footer.md --hide-source-path






## Quick Start

Work-in-progress.

!INLINE ./snippets/intro-section-footer.md --hide-source-path




