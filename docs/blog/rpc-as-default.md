# RPC as Default

Today, for most web developers,
REST and GraphQL are the default choice
to create a backend API.

[RPC](/docs/what-is-rpc.md#what-is-rpc)
is often ignored.

We believe this to be an important mistake.

- [What is RPC](#what-is-rpc)
- [Start with RPC](#start-with-rpc)
- [RPC as default](#rpc-as-default-1)
- [RPC-like](#rpc-like)
- [Conclusion](#conclusion)

#### What is RPC

RPC denotes the practice of calling a procedure that is defined on a remote computer(/process)
as if it were defined locally on the same computer(/process).

For example between a Node.js backend and a browser frontend:

~~~js
// Node.js server

// Wildcard API is an RPC implementation for Node.js backends
const {endpoints} = require('telefunc/server');

// We define a function (aka procedure) `hello` on a Node.js server.
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'telefunc/client';

(async () => {
  // We call the procedure `hello` remotely from the browser — we do *r*emote *p*rocedure *c*all (RPC)
  const {message} = await endpoints.hello('Elisabeth');
  console.log(message); // Prints `Welcome Elisabeth`
})();
~~~

RPC enables you to directly use SQL or your ORM while developing your frontend.

~~~js
const {endpoints} = require('telefunc/server');
const Todo = require('./path/to/your/data/models/Todo');

// We get the data for the landing page

endpoints.getLandingPageData = async function() {
  const authorId = this.user.id;

  const todoList = (
    (await Todo.findMany({isCompleted: false, authorId}))
    .map(todoItem => {
      const {text, id} = todoItem;
      return todoItem;
    })
  );
  /* Or with SQL:
  const todoList = await db.query(
    "SELECT text, id FROM todo_items WHERE author_id = :authorId AND is_completed = :isCompleted",
    {authorId, isCompleted: false}
  );
  */

  const {firstName, lastName} = this.user;

  return {
    user: {
      firstName,
      lastName,
    },
    todoList,
  };
}
~~~

If you wonder what the difference between RPC and REST is,
we explain the difference at
[What is the difference between REST and RPC?](/docs/blog/rest-rpc.md#readme).

#### Start with RPC

REST and GraphQL are most useful for large applications
but,
in the development beginning of an application, you usually don't need REST nor GraphQL &mdash; RPC is enough.

The schema of RESTful or GraphQL API
acts as a rigid long-term contract between frontend and backend.
While it is a good thing if you want to stabilize a large application,
the rigid structure of a RESTful or GraphQL API gets in the way of quickly implementing a prototyping.

In the prototyping phase,
a RESTful or GraphQL API slows down development speed.

RPC, on the other hand,
allows you to stay lean and flexible, to quickly implement changes, and to quickly embrace pivots.

As your app grows to a large application
with stabilized requirements,
the need for REST or GraphQL may arise.
You can then create a RESTful or GraphQL API and
progressively transition from RPC to REST/GraphQL.

Many applications never end up needing REST nor GraphQL and RPC may allow you
to skip REST and GraphQL altogether.

Starting with RPC allows you to get a quick start while being able to later embrace REST or GraphQL.

#### RPC as default

Deciding whether to use REST or GraphQL for an application that does not yet exist
[is difficult](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-answer).
RPC allows you to implement a prototype without REST nor GraphQL at first and later decide,
as you scale and as it becomes clear what you need,
whether RPC is enough and,
if RPC is not enough,
whether either REST or GraphQL best fits your application.

In short,
use RPC as default and
switch to REST or GraphQL when and if the need arises.

#### RPC-like

For a Node.js backend you can have RPC by using [Wildcard API](https://github.com/telefunc/telefunc#readme)
and for other backends you can have an RPC-like API by creating JSON endpoints. For example with Python:

~~~python
# RPC-like API with Python and FastAPI

from fastapi import FastAPI
from .database import db, models
from .auth import AuthMiddleware

app = FastAPI()
app.add_middleware(AuthMiddleware)

# RPC-like API: we don't create CRUD endpoints, instead we
# create endpoints as the need arises — in an ad-hoc fashion.
# Similarly to what we would do with RPC.

@app.get("/get-todo-items")
def get_todo_items(user_id):
    todos = db.query(models.Todo).all()
    return todos

@app.post("/create-todo-item/{text}")
def create_todo_item(text, user_id):
    db_item = models.Item(text=text, author_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item
~~~

#### Conclusion

For your next project you may want to start with RPC (or RPC-like)
and switch to REST or GraphQL when and only if the need arises.

If you are startup,
you can use RPC to get to your seed funding round faster.
Once you've hired a large team of developers
you can progressively replace RPC with REST or GraphQL.

As Turing Award winner Donald Knuth says:

> Premature optimization is the root of all evil
