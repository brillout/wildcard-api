!OUTPUT ../readme.md

[<img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo.svg?sanitize=true" align="left" height="148" width="181">](https://github.com/brillout/wildcard-api)

# Wildcard API

*API for rapid prototyping (and beyond).*

<br/>
<br/>

Wildcard has two goals:
 1. Provide a small JavaScript library to make the creation of a custom API super easy.
 2. Debunk the common misconception that a generic API (REST/GraphQL) is always better than a custom API.

With Wildcard,
creating an endpoint is as easy as creating a JavaScript function:

~~~js
// Node.js Server

const {endpoints} = require('wildcard-api');

// We define a `hello` function on the server
endpoints.hello = async function(name) {
  // Our `hello` endpoint doesn't do much.
  // But we could use anything available to the server such as querying data.
  // E.g. with SQL:
  //    const user = await db.run(`SELECT * FROM users WHERE name = ${escape(name)};`);
  // Or ORM / NoSQL:
  //    const user = await User.findOne({name});
  return {message: 'Hi '+name};
};
~~~
~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  // Wildcard makes our `hello` function available in the browser
  // (Behind the curtain Wildcard makes an HTTP request)
  const {message} = await endpoints.hello('Alice');

  // We use the DOM API but we could also use React, Angular, Vue, etc.
  document.body.textContent = message;
})();
~~~

Calling `endpoints.hello` in the browser returns a promise that is resolved after Wildcard as done the following:
 1. Serializes the argument `'Alice'`, makes an HTTP request to `/wildcard/hello`
 2. Calls the `endpoints.hello` function we defined on the server, serializes `{message: 'Hi Alice'}`, sends an HTTP response
 3. Deserializes the HTTP response, and resolve the promise

Wildcard provides:
 - Correct serialization (we use JSON++ instead of JSON)
 - Error handlings (such as showing a popup to the user when the client looses network connection)
 - Dev tools (such as API inspection)
 - Universal/Isomorphic/SSR support

#### Contents

 - [Example](#example)
 - [Custom API vs Generic API](#custom-api-vs-generic-api)
 - [Quick Start](#getting-started)


## Example

Let's consider an API for a simple todo app.

~~~js
!INLINE ../example/api/view-endpoints --hide-source-path
~~~

(This is a snippet of the example at [./example](/example/).)

Our endpoints are 100% tailored to our frontend:
For The endpoint `getCompletedTodosPageData` returns exactly and only the data needed
by the page `completedTodosPage` that shows all completed todos, and

We could have something like

But we deliberately choose to have the entire data retrieval logic on the server.
This is dramatic improvement in flexiblity.
(More at "Usage Manual - Tailored Appraoch")

the endpoint `getLandingPageData` returns exactly and only the data needed
by the landing page that shows user information and all todos that aren't completed.

We could have created generic endpoints instead:

~~~js
!INLINE ../example/api/generic-endpoints --hide-source-path
~~~

But we deliberately choose to implement a tailored API instead of a generic API.

Let's see why.



## Custom API vs generic API

> TLDR;
> If you have a tight frontend-backend development, then use a custom API.
> If you need to decouple the frontend development from the backend development, then use a generic API.

> 
> If you want decoupled
> With a custom API we completely shift the data retrieval logic from the client to the server.
> This means that a custom API is more powerful than a generic API but it comes with three conditions: frontend and backend need to be developed hand in hand and
> When these conditions are met,
> which is the case for most small/medium sized full-stack JavaScript apps,
> then a custom API is the right choice,
> For large application these conditions are often not met and a generic API is the right choice.

The crucial structural difference between a custom API and generic API is that a custom API tightly couples frontend and server development whereas a generic API decouples them.

Let's 
The fundamental difference between a custom API and generic API
is where the data retrieve logic lives.
or example

With a custom API it is the server that determines what data the client receives.
With a generic API the control 
The data retrieval logic 

With a custom API the data retrieval logic lives on the server.
With a generic API the data retrieval logic lives on the client.

The fundamental difference between a custom API and a generic API is that a custom API is 
of the problem of a custom API

~~~js
endpoints.getTodos = async function() {
  const todos = await runSQL('SELECT id, text FROM todos;');
  return todos;
};
~~~

##### Tight full-stack dev

The SQL is predefined on the server.
So if the frontend needs a change, then we need to modify the SQL query on the server.
This means that the frontend and the server need to be developed hand in hand.
The frontend developed becomes tightly coupled with the server development.
This can be an issue for large applications that have a strict separation between clients and server.


##### Benefit

On the other hand, this means that we can use any arbitrary SQL query to whatever data need.
We are not limited by the schema of a generic API.
Instead we can write any SQL query to retrieve whatever data the frontend needs.
Instead of going over the schema generic API, we can write any SQL query to retreive the data the frontend needs.
We don't need

This means that a custom API is certainly the right choice
for a prototype developed by one full-stack developer, this thight development is given.
But for a prototype that is
A single full-stack dev developing a full-stack JavaScript app.
With something like Next.js or Reframe

Or a medium-sized application with one team that develops both the frontend and the backend.

For example if you use SQL, then SQL and a custom API is vastly more powerful than any generic API.

##### Disadvantage

Third parties are developed by, well, third parties.
. The development is decoupled.
A custom API is of no use and a generic API is required.

For large application, having a frontend developed independently from the backend can make sense.
For example to be able to have a team that focus fully on the backend without worrying about the frontend and vice versa.


The second is for large application where the frontend development happens indepentently of backend development.
For large appl
It often makes sense

We have an inherent decoupled development
This is a limitation
On the other
but on the other hand it comes with great fle
If we accept 

This means that we frontend 
It is the server that 
Everytime 
Predef

A full-stack engineer develops the frontend and the backend hand in hand.

Framework such as Next.js 
develop deploy at the same time

The trend 

But because 

In our example above we


predefined on the server.

A prototype implement with a JavaScript web framework Next.js or Reframe meets

full-stack JavaScript apps

The SQL query.
This 
Predefined.

 - developed and deployed hand in hand
 - the API isn't consumed by third parties
 - not too many endpoints



## Tailored Approach

To see why a tailored API makes sense,
let's imagine we want to implement a new feature for our todo app:
We want a page that shows all the todos that the user has shared with someone.

Getting our list of shared todos is very difficult
with a RESTful/GraphQL API.
(You'd need to extend the RESTful/GraphQL API in a clunky and unnatural way.)
In general,
any data requirement that doesn't fit the schema of a generic API is problematic.

But with a tailored API, it's easy:
We simply create a new endpoint that uses SQL to query the list of shared todos.
We can "directly" run SQL queries and we don't have to go over the indirection of a generic API.

###### Full backend power

A frontend developer can use any arbitrary SQL query to retrieve whatever the frontend needs.
SQL is much (much!) more powerful than any RESTful or GraphQL API.
Behind the curtain a RESTful/GraphQL API will perform SQL queries anyways.
Going over a generic API is simply an indirection and a net loss in power.

One way to think about Wildcard is that it directly exposes the whole power of your backend to the client in a secure way.
Not only SQL queries,
but also NoSQL queries,
cross-origin HTTP requests,
etc.

Wildcard is also efficient:
A tailored endpoint can return exactly and only the data the client needs.

###### But...

A potential downside of a tailored API
is if you have many clients with many distinct data requirements:
Maintaining a huge amount of tailored endpoints can become cumbersome.

In our todo app example above,
where the browser is our only client and where we have only few endpoints,
there are virtually no reasons to not prefer a tailored API over a generic one.

On the other side of the spectrum,
if you want third parties to access your data,
then you basically have an unlimited number of clients
and a generic API is required.

## Wildcard vs REST vs GraphQL

|                           | Wildcard API \*  | RESTful API \*\* | GraphQL API |
| ------------------------- | :--------------: | :--------------: | :---------: |
| Easy to setup             | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/> <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/> |
| Performant                | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> |
| Flexible (few endpoints)  | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/><img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/> |
| Flexible (many endpoints) | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/minus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> | <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> <img src='https://github.com/brillout/wildcard-api/raw/master/docs/images/plus.svg?sanitize=true'/> |

\* Following the [Tailored Approach](#tailored-approach)
<br/>
\*\* Following at least [REST level-1](https://martinfowler.com/articles/richardsonMaturityModel.html#level1)

With many endpoints we denote a high number of endpoints
to the point of being unmanageable.
The criteria is this:
For a database change, how much effort is required to adapt the affected endpoints?
With a large amount of endpoints,
that effort can become high and using REST/GraphQL can be more appropriate.

Rough estimate of when to use what:
- A **prototype** typically has few endpoints and
  **Wildcard** is certainly the better choice.
  Example: You are a startup and you need to ship an MVP ASAP.
- A **medium-sized application** typically has a manageable amount of endpoints and
  **Wildcard** is most likely the better choice.
  Example: A team of 4-5 developers implementing a Q&A website like StackOverflow.
- A **large application** may have so many endpoints that maintaining a Wildcard API can become cumbersome and
  **REST/GraphQL** can make more sense.

You can implement your prototype with Wildcard
and later migrate to REST/GraphQL
if your application grows into having too many endpoints.
Migration is easily manageable by progressively replacing Wildcard endpoints with RESTful/GraphQL endpoints.

Also, combining a Wildcard API with a RESTful/GraphQL API can be a fruitful strategy.
For example, a RESTful API for third-party clients combined with a Wildcard API for your clients.
Or a GraphQL API for most of your data requirements combined with a Wildcard API
for couple of data requirements that cannot be fulfilled with your GraphQL API.


## Getting Started

Work-in-progress.

(Although you can go ahead and use it. `npm install wildcard-api` then define functions on `const {endpoints} = require('wildcard-api')` on the server, then use them in the browser with `import {endpoints} from 'wildcard-api/client';`. See the [example](/example/) to see how to integrate with Express (or any other server framework).)
