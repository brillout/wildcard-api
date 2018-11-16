!OUTPUT ../readme.md

[<img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo.svg?sanitize=true" align="left" height="148" width="181">](https://github.com/brillout/wildcard-api)

# Wildcard API

*API for rapid prototyping (and beyond).*

<br/>
<br/>

Wildcard has two goals:
 1. Provide a small JavaScript library to make the creation of a custom API super easy.
 2. Debunk the common misconception that a generic API (REST/GraphQL) is a silver bullet.
    A generic API is great for third party clients and large applications
    but is an unecessary burden for rapid prototyping and medium-sized applications.

With Wildcard,
creating an endpoint is as easy as creating a JavaScript function:

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

That's all Wildcard does:
It simply makes a function defined on the server "callable" in the browser.
(Behind the curtain Wildcard makes an HTTP request.)

How you retrieve data is entirely up to you.
You can use SQL, ORM, NoSQL, GraphQL, etc.
(The Wildcard-GraphQL combination is explained later.)


### Why Wildcard

Wildcard makes
retrieving (and mutating) data from the frontend a seamless experience:
No schema,
no permission rules,
just create functions on `endpoints`.

Your endpoint functions effectively act as "permission holes".
This is a simple alternative to otherwise complex permissions mechanisms.

To make the experience further seamless,
Wildcard provides:
 - Error handling
   <br/>
   Using [fetch-error-handling](https://github.com/brillout/fetch-error-handling).
 - Extended JavaScript serialization
   <br/>
   Using [JSON++](https://github.com/brillout/jpp) instead of JSON.
 - Universal/Isomorphic/SSR support.
   <br/>
   In a seamless way.
   (To preserve the request context,
   endpoints are directly called instead of going over HTTP
   when the client and server are running in the same process.)

It is an ideal tool for rapid protoyping:
Write the couple of data queries (SQL/ORM/NoSQL/GraphQL) your prototype needs, wrap them in endpoint functions, and you're good to go.
(That's it! Without any schema and permission rules.)

That said, a custom API and Wildcard are not suitable for:
 - Third party clients where a generic API is inherently required.
 - Large applications with a backend development decoupled from frontend development.
 - Large applications with a backend development independently of the frontend development.

[Custom API vs Generic API](#custom-api-vs-generic-api)
explores the different uses cases for custom and generic APIs.

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


#### Tight frontend-backend development

An endpoint like

~~~js
endpoints.getLandingPageData = async function() {
  const user = await getLoggedUser(this.headers);
  // Or with NoSQL/ORM `const todos = await Todo.find({authorId: user.id}, {fields: ['id', 'text']});`
  const todos = await db.query('SELECT id, text FROM todos WHERE authorId = ${user.id};');
  return {user, todos};
};
~~~

tightly couples frontend development with backend development.
For example,
if the frontend needs the todo creation dates,
then the SQL query defined on the server needs to be changed to `SELECT id, text, created_at`.

Using a custom API requires a tight frotnend-backend development.
This requirement comes with benefits.

### Benefits

With a tight frontend-backend development, the frontend and backend can change at the same time.
That means that a frontend developer can 
The full power of the server is one endpoint function away.

Whereas with a generic API the frontend is constrained by the schema of the generic API.
A generic API i

With tools that automatically generate RESTful API or GraphQL API, REST/GraphQL can be a convenient way to access data.
But you still need to define permissions.
You still need a permission layer on top of such generated API.
Combining
A generated API can be combined with Wildcard to create a perission layer.
to provide a full frontend-to-database solution.
Wildcard can act as such permission layer.
For examle, Wildcard works well with a GraphQL API generated by Prisma or Hasura.


When a generic API is automatically generic (e.g. with tools such as Prisma and Hasura) can be a convenient.
But still, a permission layer is still required on top of such automatically generated APIs.
Wildcard GraphQL
One useful 

A generic API 

A frontend developer has the whole power as its dispsoal

In a tight frontend-backend development context,
In a sense a generic API is simply an unecessary indirection.

**Transparent**

The full power of the backend is away for a frontend developer.
In contrast 


**Lightweight permission layer**

Instead of a generic complex access control layer.
Fine grained

The trick here is that instead of thinking of a global permission at once aheed.
we care about permission as the frontend


### Limitations

A tight frontend-backend development is not always feasiable/desirable.

Wildcard cannot be used with a decoupled:
If a frontend developer cannot make changes to an endpoint function, then a cusotm API is prohabitvely inflexible.

needs to be able to change the endpoint functions
If a frontend 

###### Third parties

In particular third party clients are developed independetly of you backend and API.
If you want third parties to access your data, then you need a generic API.
That said, you can still use Wildcard for your clients in addition to maintaining a generic API for third parties.

###### Large applications

For large application, having a frontend developed independently from the backend can make sense.
For example to be able to have a team that focus fully on the backend without worrying about the frontend and vice versa.
Also, for large applications, having a team that develops the backend independently of the frontend can make sense.
In such decoupled sce

A server API can be a solution for large scale applications.
The server API holds the endpoint functions and is developed hand-in-hand with the frontend.
It would essentially act as a permission bridge between the frontend and the database.





A custom API tightly couples frontend development with backend development.
For example

If .
A frontend change induces a backend change.
In other words, the frontend development is tightly coupled with backend development.




Long before de facto standard
Historally because tightly couples 
and REST .
With the

When using JavaScript on the browser as well on the server
When using  both the client and the server are developed and deployed at the same time.
This means that 



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

##### Tight frontend-backend development

##### Benefit

Custom APIs are nothing new and even existed long before REST.
Back then, one problem then with Custom API

A custom API with
a tight frontend-backend development is a powerful combination:
A frontend developer can use any arbitrary SQL query (or NoSQL/ORM query) to retrieve whatever the frontend needs.

If you have a SQL database and a tight frontend-backend development,
then a generic API is a net loss of power (the frontend developer is constrainted to the RESTful/GraphQL schema)
whereas with a custom API we preseve the full power of SQL (the frontend developer can use any SQL query).
And SQL is much more powerful than any RESTful/GraphQL schema.
(There are queries that can be expressed with SQL but not with REST/GraphQL
(Queries, such as "get all the todos that the user has shared to someone".)

For example, in the following situation a tight a custom API
 - You are a full-stack developer writing an MVP
 - You are using Node.js full-stack JavaScript app

Frameworks such as Next.js or Reframe deploy

Not only is a custom API more powerful but also much easier to set up.






Or if
A frontend developer can use any arbitrary SQL query to retrieve whatever data the frontend needs.

(E.g. querying is not easily feasible
They are many request that cannot be with a GraphQL schema 

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

A custom API is problematic when
 - Third parties need to access your data
 - Your application is developed by a large team

A generic API is

Third party clients are developed indepentently of your server and a tight frontend-backend is not possible.

The bigger your applications the more it can make sense to have the backend developed indepentently of the frontend.

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
