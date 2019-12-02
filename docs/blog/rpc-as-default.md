## RPC as Default

Today,
REST and GraphQL are the default choice to create an API.
[RPC](/docs/what-is-rpc.md#what-is-rpc)
is rarely considered as the default choice.

For a large project with many developers and many third-party developers,
ignoring RPC makes sense:
you need a structured API and RPC's schemaless nature is no fit.

But,
for a prototype that needs only few API endpoints,
you don't really need REST nor GraphQL &mdash; RPC is enough.

If you are startup and you want to ship an MVP as quickly as possible,
time-to-market is precious and researching whether REST or GraphQL
best fits your application
costs time.

RPC enables you to postpone the "REST or GraphQL" decision.
You can start with RPC today and,
as you scale and as the need for a structured API arises,
you create a RESTful or GraphQL API
and progressively replace your RPC endpoints with your newly created RESTful/GraphQL API.

Deciding whether to use REST or GraphQL for an application that does not yet exist [is difficult](/docs/blog/rest-or-graphql.md#rest-or-graphql-a-simple-and-unexpected-answer) at best, if not impossible.
RPC enables you to deliver and evolve an MVP
while progressively gathering information about the requirements of your business before deciding between REST and GraphQL.

With RPC,
you can get to your seed funding round faster
and, as you rise your series A and hire more developers,
you progressively replace RPC with REST or GraphQL.

In short,
use RPC as default.

For JavaScript and Node.js you can use the RPC implementation
[Wildcard API](https://github.com/reframejs/wildcard-api).
For other server frameworks,
you can achieve something like RPC by implementing custom routes.
~~~python
// RPC-like API with Python and FastAPI

from fastapi import FastAPI
from .database import db, models
from .auth import AuthMiddleware

app = FastAPI()
app.add_middleware(AuthMiddleware)

// RPC-like API: we don't create CRUD endpoints, instead we
// create endpoints as the need arises in an ad-hoc fashion.
// On a high level, this is the same as RPC.

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
