// Example of unrecommended way of designing telefunctions

const { server } = require("telefunc/server");
const db = require("../db");
const { getLoggedUser } = require("../auth");

server.getUser = async function () {
  const user = await getLoggedUser();
  return user;
};

server.getTodos = async function (completed) {
  const user = await getLoggedUser();
  if (!user) return;

  if (![true, false].includes(completed)) return;

  const todos = await db.query(
    `SELECT * FROM todos WHERE authorId = :authorId AND completed = :completed;`,
    { authorId: user.id, completed }
  );

  return todos;
};
