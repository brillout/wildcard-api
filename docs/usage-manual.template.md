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

## Custom API vs Generic API

> TLDR;
>  - If you have a tight client-API development, then use a custom API.
>  - If you need to decouple client development from API development, then use a generic API.
>  - Start your prototype with a custom API then progressively replace it with a generic API

#### Contents

 - [Tight client-API development](#tight-client-api-development)
 - [Use Cases - Custom API](#use-cases--custom-api)
 - [Use Cases - Generic API](#use-cases--generic-api)
 - [Use Cases - Hybrid](#use-cases--Hybrid)

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

!INLINE ./snippets/usage-section-footer.md --hide-source-path


### Use Cases - Custom API

- **Full-stack JavaScript**.
  <br/>
  Wildcard excels with following setup:
  Node.js + React/Vue/Angular/etc. + tight frontend-backend development.
  The ease of Wildcard is hard to beat:
  You write the data queries (SQL/ORM/NoSQL) the frontend needs, wrap them in endpoint functions, and that's it.
  And, because you develop the frontend and backend at the same time,
  changing these data queries as you develop the frontend is not a problem.
  We would argue that there are no reason to not use Wildcard in such setup.
  One way to think about Wildcard
  a thin permission layer to expose the whole power of the backend to the frontend:
  the whole power of the backend is on endpoint function away.
  Anything the backend can do is one endpoint function.

- **SSR frameworks**.
  <br/>
  With frameworks such as
  [Next.js](https://github.com/zeit/next.js#readme)
  or
  [Reframe](https://github.com/reframejs/reframe#readme)
  ,
  the frontend and backend are written in JavaScript and developed at the same time.
  This corresponds to the full-stack JavaScript setup described and Wildcard is a good fit.

- **Single developer**.
  <br/>
  If you want to develop an app by yourself,
  you will own the frontend and backend development.
  Choosing full-stack JavaScript with Wildcard is then a good choice for rapid development.

- **Full-stack developers**.
  <br/>
  If the frontend is developed by full-stack developers,
  then using a Node.js API server with Wildcard can be used to retrieve/mutate data from the frontend.
  The rest of the backend can be written with Node.js or with Python, Go, Rust, etc.

- **Mobile apps with PWA**.
  <br/>
  [PWA](https://developers.google.com/web/progressive-web-apps/)
  is an exciting new technology that bridges the web with mobile.
  With PWA your mobile app is simply a web app.
  You can then choose a setup with full-stack JavaScript and Wildcard.

- **Large application + API server**.
  Decoupling backend development from frontend development makes sense for large applications with a high number of developers.
  A way to achieve this is to setup an Node.js API Server that is maintained by the frontend team while the rest of the backend is maintained by the backend team.
  The server API has access to the whole backend while using Wildcard as permission layer.
  That way the frontend team can directly access the backend/databases without being constraint by the schema of a generic API.

!INLINE ./snippets/usage-section-footer.md --hide-source-path






### Use Cases - Generic API

- **Third parties**.
  <br/>
  A third party wants to be
  able to retrieve/mutate all kinds of data in all kinds of ways.
  In other words: it expects a generic API.
  This is the use case where GraphQL excels.

- **Large applications**.
  <br/>
  Developers of a large application are often split into a frontend and backend team.
  The backend team doesn't know the frontend's data requirements and provides a generic API for the frontend team to consume.
  This is a good use case for a generic API.
  An alternative is to set up a custom API with a server API that is maintained by the frontend team
  (see
  [Use Cases - Custom API - Server API](#use-cases--custom-api)
  )
  .

!INLINE ./snippets/usage-section-footer.md --hide-source-path




### Hybrid

Combining a custom API with a generic API can be a successfull strategy.

- **First custom API, later generic API**.
  decouple client development from API development,
  you can progressively replace custom API endpoints with a generic API.

- **Permission layer for GraphQL/REST**.
  <br/>
  When a RESTful/GraphQL API is automatically generated,
  (such as with [Prisma](https://github.com/prisma/prisma) or [Hasura](https://github.com/hasura/graphql-engine))
  it can be a convenient way to retrieve/mutate data.
  Still, a permission layer is required
  and Wildcard can act as such permission layer.

- Custom API for your clients + RESTful API for third party clients
  From the is superior in almost every way.
  But GraphQL comes with considerably higher setup cost than

  from the a develo
  GraphQL for third parties provides an important increase in flexibility GraphQL 

- GraphQL API + Custom API for couple of data requirements.
  <br/>
  Browser frontend for Large application

!INLINE ./snippets/usage-section-footer.md --hide-source-path
