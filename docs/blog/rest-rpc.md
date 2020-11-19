# What is the difference between REST and RPC?

There is a lot of confusion in API terminology.
For example, the term REST is often wrongly used to denote an RPC-like API.

Let's clarify the definition of following terms.

- [RPC](#rpc)
- [JSON endpoints](#json-endpoints)
- [REST level-0](#rest-level-0)
- [REST level-5](#rest-level-5)
- [RPC-like](#rpc-like)

&nbsp;

##### RPC

RPC denotes the practice of calling a procedure that is defined on a remote computer(/process)
as if it were defined locally on the same computer(/process).

<details>
<summary>
JavaScript Example
</summary>

~~~js
// Node.js server

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
</details>

A more elaborate definition can be found [here](/docs/what-is-rpc.md#what-is-rpc).

&nbsp;

##### JSON endpoints

*JSON endpoints* denotes the practice of creating HTTP routes that return JSON data.

JSON endpoints are RPC-like but are not *not* RPC.

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

app.get('/get-todo-items', async (req, res) => {
  const {user} = req;
  const todos = await Todo.findAll({authorId: user.id});
  return todos;
});

app.get('/create-todo-item/:text', async (req, res) => {
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

&nbsp;

##### REST level-0

REST defines its methodology over 5 levels of principles.

The first level, REST level-0, stipulates the usage of the HTTP protocol to transport data.

Any API that uses HTTP is a REST level-0 API;
RPC and JSON endpoints are REST level-0 APIs.

&nbsp;

##### REST level-5

For an API to be called REST, it needs to follow *all* REST levels.

The last level, REST level-5, stipulates that an API should only consist of CRUD operations on a list of data models.
This list of data models is usually called the API schema.

&nbsp;

##### RPC-like

APIs can be classified by whether they have a schema or not.

Schemaless:
- RPC
- JSON endpoints
- REST level-0

Schema:
- REST
- GraphQL

The term *RPC-like* is commonly used to denote an API that is schemaless.
