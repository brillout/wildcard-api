<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=80 alt="Wildcard API"/>
  </a>
</p>
<p align='center'><a href="/../../#readme">Intro</a> &nbsp; | &nbsp; <a href="/docs/custom-vs-generic.md#readme"><b>Custom vs Generic</b></a> &nbsp; | &nbsp; <a href="/example/#readme">Example</a></p>
&nbsp;

# Custom vs Generic

Comparison of custom APIs with generic APIs.

- **_Custom API_**
  <br/>
  An API that only fulfills the data requirements of your clients.
  Such as
  a Wildcard API or
  a [REST level 0](https://martinfowler.com/articles/richardsonMaturityModel.html#level0) API.
- **_Generic API_**
  <br/>
  An API that is designed to support a maximum number of data requirements.
  Such as
  a GraphQL API or
  a [REST level >=1](https://martinfowler.com/articles/richardsonMaturityModel.html#level1) API.

> TL;DR
>  - We recommend a custom API with an API tightly developed with your frontend.
>  - We recommend a generic API if your API development needs to be decoupled from frontend development.
>  - You can start with a custom API then progressively replace it with a generic API.

#### Contents

 - [Tight development](#tight-development)
 - [Use Cases: Custom API](#use-cases-custom-api)
 - [Use Cases: Generic API](#use-cases-generic-api)
 - [Use Cases: Hybrid](#use-cases-hybrid)


<br/>


### Tight development

An endpoint like

~~~js
// This endpoint is tailored to the frontend: It returns exactly and only what the landing page needs
endpoints.getLandingPageData = async function() {
  const user = await getLoggedUser(this.headers);
  const todos = await db.query('SELECT id, text FROM todos WHERE authorId = ${user.id};');
  return {user, todos};
};
~~~

tightly couples the API development with the frontend development:
For example,
if changes are made to the frontend that need the todos' creation date,
then the SQL query of `getLandingPageData` needs to be changed to `SELECT id, text, created_at`.

A custom API works best with an API developed tightly with your frontend.

<b><sub><a href="#usage">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>
<br/>






### Use Cases: Custom API

- **Full-stack JavaScript**.
  <br/>
  A frontend + backend written in the same language
  lends itself to a tight frontend-backend development
  and you can use a custom API developed hand-in-hand with your frontend.

- **JavaScript web frameworks**.
  <br/>
  With frameworks such as
  [Next.js](https://github.com/zeit/next.js#readme)
  or
  [Reframe](https://github.com/reframejs/reframe#readme)
  ,
  the frontend and backend are written in JavaScript and developed at the same time.
  Here again, a custom API is good fit.

- **Single developer**.
  <br/>
  If you want to develop an app by yourself,
  you will own both the frontend and backend development.
  You can then use a custom API to quickly ship a prototype.

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

<b><sub><a href="#usage">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>
<br/>







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

<b><sub><a href="#usage">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>
<br/>








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

<b><sub><a href="#usage">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>
<br/>



<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/custom-vs-generic.template.md` instead.






-->
