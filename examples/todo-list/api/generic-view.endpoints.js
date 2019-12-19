// Example of unrecommended way of designing endpoints

const {endpoints} = require('@wildcard-api/server');
const db = require('../db');
const {getLoggedUser} = require('../auth');

endpoints.getUser = async function() {
  const user = await getLoggedUser(this.headers);
  return user;
};

endpoints.getTodos = async function(completed) {
  const user = await getLoggedUser(this.headers);
  if( ! user ) return;

  if( ![true, false].includes(completed) ) return;

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = :completed;`,
    {authorId: user.id, completed}
  );

  return todos;
};
