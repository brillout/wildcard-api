!MENU_ORDER 2
!INLINE ./header.md --hide-source-path
!MENU
&nbsp;

# Usage


 - [API](#api)
 - [SSR](#ssr)
 - [Error Handling](#error-handling)
 - [Custom API vs Generic API](#custom-api-vs-generic-api)

<br/>

## API


TODO

!INLINE ./snippets/usage-section-footer.md --hide-source-path




## Error Handling

By default, Wildcard uses
[Handli](https://github.com/brillout/handli)
to automatically handle network corner cases.

You can get rid of Handli and handle network errors yourself
by constructing the Wildcard client yourself
and providing your own implementation of `makeHttpRequest`.
You have then full control over how HTTP requests are made,
including how HTTP errors are handled.

More infos at [API](#api).

!INLINE ./snippets/usage-section-footer.md --hide-source-path





## SSR

The request context needs to be preserved while doing server-side rendering.

You can use the `Function.prototype.bind()` method to do so:

~~~js
const {endpoints} = require('wildcard-api/client');

async function getInitialProps({isServer, request: {headers}={}}) {
  let {getLandingPageData} = endpoints;
  if( isServer ) {
    // We pass on the HTTP headers of the original user request
    const context = {headers};
    getLandingPageData = getLandingPageData.bind(context);
  }

	const landingPageData = await getLandingPageData();
  return landingPageData;
}
~~~

The endpoint `getLandingPageData` then has access to `headers`:

~~~js
const {endpoints} = require('wildcard');

endpoints.getLandingPageData = async function(){
  const {headers} = this;

  const user = await getLoggedUser(headers);

  const moreInfo = await getMoreInfo();

  return {user, ...moreInfo};
};
~~~

When the client runs in Node.js,
the context originates from our `bind` call above.

When the client runs in the browswer, the context originates from:

~~~js
const express = require('express');
const {getApiResponse} = require('wildcard-api');

const app = express();

app.all('/wildcard/*' , async(req, res, next) => {
  const {headers} = req;
  const context = {headers};
  const apiResponse = await getApiResponse(context);

  if( apiResponse ) {
    res.status(apiResponse.statusCode);
    res.send(apiResponse.body);
  }

  next();
});
~~~

!INLINE ./snippets/usage-section-footer.md --hide-source-path



## Custom API vs Generic API

> TLDR;
>  - If you have a tight client-API development, then use a custom API.
>  - If you need to decouple client development from API development, then use a generic API.
>  - Start your prototype with a custom API then progressively replace it with a generic API

#### Contents

 - [Tight client-API development](#tight-client-api-development)
 - [Use Cases: Custom API](#use-cases-custom-api)
 - [Use Cases: Generic API](#use-cases-generic-api)
 - [Use Cases: Hybrid](#use-cases-hybrid)

<br/>



### Tight client-API development

Endpoints such as

~~~js
endpoints.getLandingPageData = async function() {
  const user = await getLoggedUser(this.headers);
  const todos = await db.query('SELECT id, text FROM todos WHERE authorId = ${user.id};');
  // Or with NoSQL/ORM `const todos = await Todo.find({authorId: user.id}, {fields: ['id', 'text']});`
  return {user, todos};
};
~~~

tightly couples frontend development with API development.
For example, if the frontend needs the todo creation dates,
then the SQL query of the `getLandingPageData` endpoint needs to be changed to `SELECT id, text, created_at`.

A custom API requires a tight client-API development.

A prototype is usually developed by one or two developers and a tight frontend-backend development is given.

A tight frontend-backend development combined with a custom API is powerful:
Instead of being limited by the structure of a generic API's schema,
all kinds of custom endpoints can be written and do exactly what the frontend needs.
In particular, with Wildcard, the whole power of the backend is only one JavaScript function away to the frontend.

!INLINE ./snippets/usage-section-footer.md --hide-source-path






### Use Cases: Custom API

- **Full-stack JavaScript**.
  <br/>
  A frontend + backend written in the same language
  lends itself to a tight frontend-backend development and a custom API is recommended.
  And with full-stack JavaScript,
  Wildcard allows you to create a custom API with JavaScript functions and zero setup.

- **SSR frameworks**.
  <br/>
  With frameworks such as
  [Next.js](https://github.com/zeit/next.js#readme)
  or
  [Reframe](https://github.com/reframejs/reframe#readme)
  ,
  the frontend and backend are written in JavaScript and developed at the same time.
  Here again, a custom API / Wildcard is good fit.

- **Single developer**.
  <br/>
  If you want to develop an app by yourself,
  you will own the frontend and backend development.
  Choosing full-stack JavaScript with Wildcard is then a good choice for rapid development.

- **Full-stack developers**.
  <br/>
  If the frontend is developed by full-stack developers,
  having a custom API developed by the frontend is a sensible choice.

- **Mobile apps with PWA**.
  <br/>
  [PWA](https://developers.google.com/web/progressive-web-apps/)
  is an new technology that bridges the web with mobile.
  With PWA your mobile app is simply a web app.
  You can then choose full-stack JavaScript and Wildcard.

- **Large application + API server**.
  <br/>
  Decoupling backend development from frontend development makes sense for large applications that have a high number of developers.
  A way to achieve this is to setup an Node.js API server maintained by the frontend team.
  The rest of the backend is maintained by the backend team and can be written
  with Node.js or with Python, Go, Rust, etc.
  The server API has access to the whole backend while using Wildcard as permission layer.
  That way the frontend team can directly access the backend/databases without being constrained by the schema of a generic API.

!INLINE ./snippets/usage-section-footer.md --hide-source-path







### Use Cases: Generic API

- **Third parties**.
  <br/>
  Third parties want to be
  able to retrieve/mutate all kinds of data in all kinds of ways.
  In other words: Third parties want a generic API.
  This is the use case where GraphQL excels most.

- **Large application**.
  <br/>
  Developers of a large application are often split into a frontend and backend team.
  The backend team doesn't know the frontend's data requirements and provides a generic API for the frontend team to consume.
  An alternative is to set up a custom API on an API server maintained by the frontend team.

!INLINE ./snippets/usage-section-footer.md --hide-source-path








### Use Cases: Hybrid

Combining a custom API with a generic API can be a successfull strategy.

- **First custom API, later generic API**.
  <br/>
  Your first prototype will most likely have a tight frontend-backend development
  and a custom API is the right choice.
  Afterwards,
  and as your prototype grows into a large application,
  you can progressively replace custom API endpoints with a generic API.

- **Permission layer for generated GraphQL/RESTful API**.
  <br/>
  A RESTful/GraphQL API that is automatically generated,
  such as with [Prisma](https://github.com/prisma/prisma) or [Hasura](https://github.com/hasura/graphql-engine),
  can be a convenient way to retrieve/mutate data.
  A custom API / Wildcard can then act as a permission layer on top of such generated API.

- **Custom API + GraphQL API**.
  <br/>
  This is the most powerful setup:
  Third parties have the full power of GraphQL and your clients have even more power with custom endpoints.

- **Custom API + RESTful API**.
  <br/>
  From the perspective of a third party,
  GraphQL is superior to REST.
  But a GraphQL API is considerably more difficult to implement than a RESTful API.
  You can, instead and at first, offer a RESTful API for third party clients
  while your clients use
  a custom API to get full power/flexibility.

!INLINE ./snippets/usage-section-footer.md --hide-source-path


