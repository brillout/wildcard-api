const { server } = require("telefunc/server");
const { context } = require("telefunc/context");
const db = require("../db");
const { getLoggedUser } = require("../auth");

// Our view endpoints are tailored to the frontend. For example, the endpoint
// `getLandingPageData` returns exactly and only the data needed by the landing page

server.getLandingPageData = async function () {
  // `context` holds request information such as HTTP headers
  const user = await getLoggedUser(context.headers);
  if (!user) return { userIsNotLoggedIn: true };

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = false;`,
    { authorId: user.id }
  );

  // The landing page displays user information, so we return `user`
  return { user, todos };
};

server.getCompletedPageData = async function () {
  const user = await getLoggedUser(context.headers);
  if (!user) return { userIsNotLoggedIn: true };

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = true;`,
    { authorId: user.id }
  );

  // We don't return `user` as the page doesn't need it
  return { todos };
};
