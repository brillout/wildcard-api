const {endpoints} = require('../..');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// Our view endpoints are tailored to the frontend: For example, the endpoint
// `getLandingPageData` returns exactly and only the data needed by the landing page

// Endpoint to get data the landing page needs
endpoints.getLandingPageData = async function () {
  // `this` holds contextual information such as HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(`SELECT * FROM todos WHERE authorId = ${user.id} AND completed = false;`);

  // We return `user` as the landing page displays user information.
  return {user, todos};
};

// Endpoint to get the data needed by the page showing all completed todos
endpoints.getCompletedTodosPageData = async function () {
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(`SELECT * FROM todos WHERE authorId = ${user.id} AND completed = true;`);

  // We don't return `user` as the page doesn't need it
  return {todos};
};
