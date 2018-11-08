const {endpoints} = require('../..');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// Endpoint to get all the data that the landing page needs
endpoints.getLandingPageData = async function () {
  // `this` holds contextual information such as the HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(`SELECT * FROM todos WHERE authorId = ${user.id} AND completed = false;`);

  // The landing page displays user information.
  // Thus we return `user`.
  return {user, todos};
};

// Endpoint to get all the data needed by the page showing all completed todos
endpoints.getCompletedTodosPageData = async function (
  // We could have parameters here just like any regular JavaScript function.
  // (Although the passed arguments need to be JSON serializable.)
) {
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(`SELECT * FROM todos WHERE authorId = ${user.id} AND completed = true;`);

  // Our `completedTodosPage` only displays the list of completed todos.
  // We don't need to return `user`.
  return {todos};
};
