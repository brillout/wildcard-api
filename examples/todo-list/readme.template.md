!INLINE /docs/snippets/header.md --hide-source-path
&nbsp;

# Example - A Todo List

A (simplistic) todo app built with:
 - React
 - Wildcard API
 - Node.js
 - SQLite

#### Contents

- [Run the Example](#run-the-example)
- [Code Highlights](#code-highlights)
  - [View Endpoints](#view-endpoints)
  - [Server Integration](#server-integration)
  - [Mutation Endpoints](#mutation-endpoints)
  - [React Frontend](#react-frontend)

## Run the Example

Run the following npm scripts to build and serve the example:

0. Get the code.

   ~~~shell
   $ git clone git@github.com:telefunc/telefunc
   ~~~

1. Install dependencies.

   First the dependencies of Wildcard:
   ~~~shell
   $ yarn
   ~~~

   Then the dependencies of the example:
   ~~~shell
   $ cd example/todo-list/
   $ yarn
   ~~~

2. Build the frontend.

   ~~~shell
   $ yarn start:build
   ~~~

3. Run the server.

   ~~~shell
   $ npm run start:server
   ~~~

!INLINE /docs/snippets/section-footer.md #contents --hide-source-path


## Code Highlights

This section highlights the interesting parts of the example.

### View Endpoints

(With *view endpoint* we denote an endpoint that retrieves data.)

~~~js
!INLINE ./api/view.endpoints.js
~~~

!INLINE /docs/snippets/section-footer.md #contents --hide-source-path

### Server Integration

With Express:

~~~js
!INLINE ./start-with-express
~~~

<details>
<summary>
With Hapi
</summary>

~~~js
!INLINE ./start-with-hapi
~~~
</details>

<details>
<summary>
With Koa
</summary>

~~~js
!INLINE ./start-with-koa
~~~
</details>


!INLINE /docs/snippets/section-footer.md #contents --hide-source-path

### Mutation Endpoints

(With *mutation endpoint* we denote an endpoint that mutates data.)

~~~js
!INLINE ./api/mutation.endpoints.js
~~~

!INLINE /docs/snippets/section-footer.md #contents --hide-source-path

### React Frontend

The following code shows how our frontend
uses our Wildcard API to retrieve the user information,
the user todos,
and to update a todo.

~~~js
!INLINE ./client/LandingPage
~~~

~~~js
!INLINE ./client/Todo
~~~

!INLINE /docs/snippets/section-footer.md #contents --hide-source-path
