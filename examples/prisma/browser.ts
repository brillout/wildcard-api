import "babel-polyfill";
import { server } from "telefunc/client";
import { GetPosts } from "./getPosts.telefunc";
const getPosts = server.getPosts as GetPosts;

main();

async function main() {
  const posts = await getPosts();

  const viewEl = document.getElementById("view");
  if (viewEl === null) throw new Error();

  if (posts.length===0) viewEl.innerHTML += 'No posts.';

  posts.forEach((post) => {
    viewEl.innerHTML += "<h2>" + post.title + "</h2>";
    viewEl.innerHTML += "<p>" + post.content + "</p>";
    viewEl.innerHTML += "<br/>";
  });
}
