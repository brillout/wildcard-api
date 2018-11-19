const {endpoints} = require('wildcard-api');
const db = require('../db');
const {getLoggedUser} = require('../auth');

// Our view endpoints are tailored to the frontend. For example, the endpoint
// `getLandingPageData` returns exactly and only the data needed by the landing page

endpoints.getLandingPageData = async function () {
  // `this` holds contextual information such as HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = false;`,
    {authorId: user.id}
  );

  // We return `user` as the landing page displays user information.
  return {user, todos};
};

endpoints.getCompletedPageData = async function () {
  const user = await getLoggedUser(this.headers.cookie);
  if( ! user ) return {userIsNotLoggedIn: true};

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = true;`,
    {authorId: user.id}
  );

  // We don't return `user` as the page doesn't need it
  return {todos};
};
