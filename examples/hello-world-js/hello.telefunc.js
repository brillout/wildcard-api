const { server } = require("telefunc/server");

server.hello = async (name) => {
  return `Hello ${name}, welcome to Telefunc.`;
};
