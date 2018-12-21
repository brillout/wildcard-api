!MENU_ORDER 1
!MENU_LINK /../../
!OUTPUT ../readme.md
!INLINE ./header.md --hide-source-path
!MENU

Project goals:
 1. JavaScript library to easily create a custom API.
 2. Debunk the common misconception that a generic API is a silver bullet.
    REST and GraphQL are great tools for large applications
    but are less suited for prototypes and smaller apps.

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
Wildcard takes care of the HTTP request and serialization.
How you retrieve/mutate data is up to you and
you can use SQL, ORM, NoSQL, etc.

#### Contents

 - [Why Wildcard](#why-wildcard)
 - [Usage](#usage)
 - [Wildcard vs GraphQL/REST](#wildcard-vs-graphqlrest)


<br/>

### Why Wildcard

REST and GraphQL are great but
creating a schema and permission rules for
a prototype
that has only couple of data requirements is overkill.

In contrast, with Wildcard, you simply define JavaScript functions on Wildcard's `endpoints` object.
No schema,
no permission rules.

In essence,
these endpoint functions you define act as fine-grained "permission holes":
You allow your clients to access and do things on a case-by-case basis.
This is a simple alternative to permission rules.

The structureless nature of Wildcard is a great fit for rapid prototyping
where flexibility is paramount.
Whereas the rigid structure of a generic API
gets in the way of quickly evolving a prototype.

That said, Wildcard is not suitable for:
 - Third-party clients.
 - Large applications with an API developed independently of the frontend.

Wildcard provides:
 - **Easy setup**.
   <br/>
   Set up a Wildcard API with only couple of lines.
   Works with any server framework: Express, Koa, Hapi, etc.
 - **Error handling**. (Optional.)
   <br/>
   Using [Handli](https://github.com/brillout/handli) to automatically handle network errors
   such as when the user goes offline.
 - **Extended serialization**.
   <br/>
   Using [JSON-S](https://github.com/brillout/json-s) to support further JavaScript types.
   (Such as `Date` which JSON doesn't support.)
 - **Universal/Isomorphic/SSR support**.
   <br/>
   The Wildcard client works in the browser and on Node.js.
   With seamless support for
   server-side rendering.

!INLINE ./snippets/intro-section-footer.md --hide-source-path





## Usage

Work-in-progress.

!INLINE ./snippets/intro-section-footer.md --hide-source-path





## Wildcard vs GraphQL/REST

Comparing Wildcard with REST and GraphQL mostly boils down to comparing a custom API with a generic API.

*Custom API*:
An API that fulfills only the data requirements of your clients.
Such as
a Wildcard API or
a [REST level 0](https://martinfowler.com/articles/richardsonMaturityModel.html#level0) API.

*Generic API*:
An API that is designed to support a maximum number of data requirements.
Such as
a GraphQL API or
a [REST level >=1](https://martinfowler.com/articles/richardsonMaturityModel.html#level1) API.

We compare them at
[Usage Manual - Custom API vs Generic API](/docs/usage-manual.md#custom-api-vs-generic-api)
.

!INLINE ./snippets/intro-section-footer.md --hide-source-path




