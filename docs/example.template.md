!MENU_ORDER 3
!MENU_LINK /example/
!OUTPUT ../example/readme.md
!INLINE ./header.md --hide-source-path
!MENU

A (simplistic) todo app built with:
 - React
 - Wildcard API
 - Express
 - Node.js
 - SQLite

#### Contents

- [Code Highlights](#code-highlights)
  - [View Endpoints](#view-endpoints)
  - [Express Integration](#express-integration)
  - [Mutation Endpoints](#mutation-endpoints)
  - [React Frontend](#react-frontend)
- [Run](#run)



## Code Highlights

Showcase of the example's code.
- [View Endpoints](#view-endpoints)
- [Express Integration](#express-integration)
- [Mutation Endpoints](#mutation-endpoints)
- [React Frontend](#react-frontend)

### View Endpoints

*View endpoint*: An endpoints to retrieve data.

~~~js
!INLINE ../example/api/view-endpoints
~~~

!INLINE ./snippets/section-footer.md --hide-source-path

### Express Integration

~~~js
!INLINE ../example/start
~~~

!INLINE ./snippets/section-footer.md --hide-source-path

### Mutation Endpoints

*Mutation endpoint*: An endpoint to mutate data.

~~~js
!INLINE ../example/api/mutation-endpoints
~~~

!INLINE ./snippets/section-footer.md --hide-source-path

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

!INLINE ./snippets/section-footer.md --hide-source-path

## Run

To run the app:

0. Get the code.

   ~~~shell
   $ git clone git@github.com:brillout/wildcard-api
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

!INLINE ./snippets/section-footer.md --hide-source-path


