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
>  - Start your prototype with a custom API, then progressively replace it with a generic API

#### Contents

 - [Tight client-API development](#tight-client-api-development)
 - [Use Cases - Custom API](#use-cases--custom-api)
 - [Use Cases - Generic API](#use-cases--generic-api)

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
then the SQL query of our `getLandingPageData` endpoint needs to be changed to `SELECT id, text, created_at`.

Using a custom API requires a tight client-API development.

!INLINE ./snippets/usage-section-footer.md --hide-source-path








