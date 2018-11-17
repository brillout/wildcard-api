const {endpoints} = require('../..');
const db = require('../db');
const {getLoggedUser} = require('../auth');

endpoints.toggleComplete = async function(todoId) {
  const user = await getLoggedUser(this.headers.cookie);
  if( !user ) return;

  const todo = await getTodo(todoId);
  // Do nothing if no todo found with id `todoId`
  if( !todo ) return;

  // Do nothing if the user is not the author of the todo
  if( todo.authorId !== user.id ) return;

  const result = await db.query(
    "UPDATE todos SET completed = :completed WHERE id = :todoId;",
    {completed: !todo.completed, todoId}
  );

  console.log(result);

  const [todoUpdated] = result;

  return todoUpdated;
};

async function getTodo(todoId) {
  const [todo] = await db.query(
    `SELECT * FROM todos WHERE id = :todoId;`,
    {todoId}
  );
  return todo;
}
