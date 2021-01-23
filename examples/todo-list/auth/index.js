module.exports = { getLoggedUser };

function getLoggedUser() {
  // `context` holds request information such as HTTP headers
  // if (headers.host !== "localhost:3000") throw new Error();
  return { id: 1, username: "brillout" };
}
