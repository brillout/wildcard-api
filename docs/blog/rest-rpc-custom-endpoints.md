# What exactly does REST mean? How does it compare to RPC and custom JSON endpoints?

There is a lot of confusion in API terminology.
The term REST, for example, is often wrongly used to denote an RPC-like API.

This document clarifies the API terminology.

In general,
APIs in can be classified by whether they have a schema or not.

Schemaless (aka RPC-like):
- RPC
- Custom JSON endpoints
- REST level 0

Schema:
- REST level 5 (aka REST)
- GraphQL

Let's now have a look at the meaning of these terms.


##### RPC

Strictly speaking, RPC denotes the practice of calling a procedure that is defined on a remote computer/process
as if it were defined locally on the same computer/process.
A more elaborate definition can be found [here](/docs/what-is-rpc.md#what-is-rpc).

<details>
<summary>
JavaScript Example
</summary>

~~~js
// Node.js server

const {endpoints} = require('wildcard-api');

// We define a function (aka procedure) `hello` on a Node.js server.
endpoints.hello = function(name) {
  return {message: 'Welcome '+name};
};
~~~

~~~js
// Browser

import {endpoints} from 'wildcard-api/client';

(async () => {
  // We call the procedure `hello` remotely from the browser — we do *r*emote *p*rocedure *c*all (RPC)
  const {message} = await endpoints.hello('Elisabeth');
  console.log(message); // Prints `Welcome Elisabeth`
})();
~~~
</details>


##### Custom JSON endpoints

With *custom JSON endpoints* we denote the practice of creating new and modifying custom server routes as the need arises &mdash; in an ad-hoc fashion.
Usually, HTTP is used to transport and JSON to serialize the data.

An API consisting of custom JSON endpoints is RPC-like but it is *not* RPC.

<details>
<summary>
JavaScript Example
</summary>

~~~js
// RPC-like API with Node.js and Express

const express = require('express');
const Todo = require('./path/to/your/data/model/Todo');
const AuthMiddleware = require('./path/to/your/auth/code');

const app = express();
app.use(AuthMiddleware);

// RPC-like API: we don't create CRUD endpoints, instead we
// create endpoints as the need arises — in an ad-hoc fashion.
// Similarly to what we would do with RPC.

app.get('/get-todo-items', function (req, res) {
  res.send({test: 'bla'})
});

app.get('/create-todo-item/:text', function (req, res) {
  const {user} = req;
  const {text} = req.params;
  const newTodo = new Todo({text, authorId: user.id});
  await newTodo.save();
  return newTodo;
});

app.listen(3000, () => {console.log('Server is running.')});
~~~
</details>

<details>
<summary>
Python Example
</summary>

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
</details>


##### REST level 0

REST defines its methodology over 5 levels of principles.

The first level, REST level 0, stipulates the usage of the HTTP protocl to transport data.

Any API that uses HTTP is a REST level 0 API;
RPC and custom JSON endpoints are REST level 0 APIs.


##### REST level 5

For an API to be called REST, it needs to follow *all* the principles of all the 5 levels of REST.

A REST level 5 API, in a nutshell, is an API that consists of CRUD operations on schema models;
a REST level 5 API has a schema (whereas a REST level 0 API is schemaless).

To sum up:
- REST level 5 ⇔ REST
- REST level 0 ⇔ RPC-like


