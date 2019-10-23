!OUTPUT ../example/readme.md
!INLINE ./header.md --hide-source-path
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
   $ git clone git@github.com:reframejs/wildcard-api
   $ cd example/
   ~~~

1. Install dependencies.

   ~~~shell
   $ npm run setup
   ~~~

2. Build the frontend.

   ~~~shell
   $ npm run build
   ~~~

3. Run the server.

   ~~~shell
   $ npm run server
   ~~~

!INLINE ./snippets/section-footer.md #contents --hide-source-path


## Code Highlights

This section highlights the interesting parts of the example.

### View Endpoints

(With *view endpoint* we denote an endpoint that retrieves data.)

~~~js
!INLINE ../example/api/view-endpoints
~~~

!INLINE ./snippets/section-footer.md #contents --hide-source-path

### Server Integration

With Express:

~~~js
!INLINE ../example/start-with-express
~~~

<details>
<summary>
With Hapi
</summary>

~~~js
!INLINE ../example/start-with-hapi
~~~
</details>

<details>
<summary>
With Koa
</summary>

~~~js
!INLINE ../example/start-with-koa
~~~
</details>


!INLINE ./snippets/section-footer.md #contents --hide-source-path

### Mutation Endpoints

(With *mutation endpoint* we denote an endpoint that mutates data.)

~~~js
!INLINE ../example/api/mutation-endpoints
~~~

!INLINE ./snippets/section-footer.md #contents --hide-source-path

### React Frontend

The following code shows how our frontend
uses our Wildcard API to retrieve the user information,
the user todos,
and to update a todo.

~~~js
!INLINE ../example/client/LandingPage
~~~

~~~js
!INLINE ../example/client/Todo
~~~

!INLINE ./snippets/section-footer.md #contents --hide-source-path
