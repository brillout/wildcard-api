const { endpoints } = require("@wildcard-api/server");

const posts = require("./db/posts.json");

endpoints.getPostList = async function () {
  return posts.map(({ title }, id) => ({ id, title }));
};

endpoints.getPostData = async function ({ postId } = {}) {
  if (!postId) {
    return;
  }

  const postData = posts[postId];

  if (!postData) {
    return { noPostFound: true };
  }

  return postData;
};
