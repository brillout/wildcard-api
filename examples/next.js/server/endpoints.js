const { server } = require("telefunc/server");

const posts = require("./db/posts.json");

server.getPostList = async function () {
  return posts.map(({ title }, id) => ({ id, title }));
};

server.getPostData = async function ({ postId } = {}) {
  if (!postId) {
    return;
  }

  const postData = posts[postId];

  if (!postData) {
    return { noPostFound: true };
  }

  return postData;
};
