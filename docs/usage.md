<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=90 alt="Wildcard API"/>
  </a>
</p>
<p align='center'><a href="/../../#readme">Intro</a> &nbsp; | &nbsp; <a href="/docs/usage.md#readme"><b>Usage</b></a></p>
&nbsp;

# Usage

 - [API](#api)
 - [SSR](#ssr)
 - [Error Handling](#error-handling)
 - [Wildcard API vs GraphQL/RESTful API](#wildcard-api-vs-graphqlrestful-api)
 - [Custom API vs Generic API](#custom-api-vs-generic-api)


<br/>

## Wildcard API vs GraphQL/RESTful API

Comparing Wildcard with REST and GraphQL mostly boilds down to comparing a custom API with a generic API.

With custom API we denote an API that is designed to fulfill only the data requirements of your clients.
For example:
 - Wildcard API (following the [Tailored Approach](#tailored-approach))
 - [REST level 0](https://martinfowler.com/articles/richardsonMaturityModel.html#level0) API

With generic API we denote an API that is designed to support a maximum number of data requirements.
For example:
 - GraphQL API
 - RESTful API (following at least [REST level 1](https://martinfowler.com/articles/richardsonMaturityModel.html#level1))

We explore the use cases for custom APIs and generic APIs in the next section
[Custom API vs Generic API](#custom-api-vs-generic-api)
.

<b><sub><a href="#usage">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>
<br/>






## Custom API vs Generic API

> TLDR;
>  - If you have a tight client-API development, then use a custom API.
>  - If you need to decouple client development from API development, then use a generic API.
>  - Start your prototype with a custom API, then progressively replace it with a generic API
#### Contents

 - [Tight client-API development](#tight-client-api-development)
 - [Use Cases - Custom API](#use-cases--custom-api)
 - [Use Cases - Generic API](#use-cases--generic-api)

### Tight client-API development

An endpoint like

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
then the SQL query of the `getLoggedUser` endpoint needs to be changed to `SELECT id, text, created_at`.

Using a custom API requires a tight client-API development.

<b><sub><a href="#usage">&#8679; TOP  &#8679;</a></sub></b>
<br/>
<br/>
<br/>









<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/usage.template.md` instead.






-->
