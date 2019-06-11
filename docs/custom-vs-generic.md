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
    <img src="https://github.com/reframejs/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=80 alt="Wildcard API"/>
  </a>
</p>

<p align="center">Use JavaScript Functions as API.</p>
&nbsp;


# Custom vs Generic

Comparison of custom APIs with generic APIs.

- **_Custom API_**:
  An API that only fulfills the data requirements of your clients.
  Such as
  a Wildcard API or
  a [REST level 0](https://martinfowler.com/articles/richardsonMaturityModel.html#level0) API.
- **_Generic API_**:
  An API that is designed to support a maximum number of data requirements.
  Such as
  a GraphQL API or
  a [REST level >=1](https://martinfowler.com/articles/richardsonMaturityModel.html#level1) API.

> TL;DR
>  - Implement a generic API (GraphQL/REST) if you need third parties to access your data.
>  - Implement a generic API if your API development needs to be decoupled from your frontend development.
>  - Otherwise implement a custom API (Wildcard) tightly developed with your frontend.
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

tightly couples API development with frontend development:
For example,
if changes are made to the frontend that need the todos' creation date,
then the SQL query of `getLandingPageData` needs to be changed to `SELECT id, text, created_at`.

A custom API works only when developed hand-in-hand with the frontend.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We like talking with our users!
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>






### Use Cases: Custom API

- **Full-stack JavaScript**.
  <br/>
  A frontend + backend written in the same language
  lends itself to a tight frontend-backend development,
  and a custom API can be developed hand-in-hand with the frontend.

- **JavaScript web frameworks**.
  <br/>
  With frameworks such as
  [Next.js](https://github.com/zeit/next.js#readme)
  or
  [Reframe](https://github.com/reframejs/reframe#readme),
  the frontend and backend are written in JavaScript and developed at the same time,
  and a custom API / Wildcard fits well.

- **Single developer**.
  <br/>
  When developing an app by yourself,
  you own both the frontend developing and the backend development.
  You can then use a custom API to quickly ship a prototype.

- **API server**.
  <br/>
  Decoupling frontend development from backend development
  is a common practice.
  There is a frontend team developing the frontend,
  and a backend team developing the backend.
  If the API is developed by the backend team then a generic API is required.
  (Because the API is not developed hand-in-hand with the frontend, see [Tight development](#tight-development).)
  Alternatively, you can set up an API server:
  A server that provides an API and that has unrestricted access to the database.
  In essence, the server acts as permission layer between the database and the frontend.
  It could be a Node.js server developed by the frontend team,
  and,
  in that case,
  the API can be tightly developed with the frontend,
  and a custom API / Wildcard can be used.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We like talking with our users!
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>







### Use Cases: Generic API

- **Third parties**.
  <br/>
  From the perspective of a third party,
  the more data requirements the API can fulfill the better;
  a generic API is required.

- **Large application**.
  <br/>
  Developers of a large application are often split into a frontend team and a backend team.
  The backend team develops an API independently of what the frontend needs.
  From the perspective of the frontend team,
  the more data requirements the API can fulfill the better;
  a generic API is required.
  An alternative is to set up a custom API that is maintained by the frontend team,
  see the "API server" section above.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We like talking with our users!
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>








### Use Cases: Hybrid

Combining a generic API with a custom API can be a successfull strategy.

- **First custom API, later generic API**.
  <br/>
  You can start with a custom API to quickly ship a prototype
  and,
  as your prototype grows into a large application,
  progressively remove your custom API endpoints and replace them with a generic API.

- **Permission layer for generated GraphQL API**.
  <br/>
  An automatically generated GraphQL API
  can be a convenient way to retrieve/mutate data.
  (For example with [Prisma](https://github.com/prisma/prisma) or [Hasura](https://github.com/hasura/graphql-engine).)
  Such generated API are missing permissions,
  and a custom API / Wildcard can be used as permission layer.

- **Custom API + GraphQL API**.
  If your frontend has data requirements your GraphQL API cannot fulfill,
  then a custom API can be used to fulfill these.

- **Custom API + RESTful API**.
  <br/>
  GraphQL can fulfill a broader range of data requirements than REST.
  From the perspective of a third party,
  GraphQL is superior.
  But a GraphQL API is considerably more difficult to set up than a RESTful API.
  You can instead offer a RESTful API for third party clients
  while your clients use
  a custom API that fulfills a broader range of data requirements.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We like talking with our users!
</sup>

<br/>

<sup>
<a href="#contents"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

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
