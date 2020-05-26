import "babel-polyfill";
import endpoints from "./endpoints";

main();

async function main() {
  const posts = await endpoints.getPosts();
  const viewEl = document.getElementById("view");
  posts.forEach((post) => {
    viewEl.innerHTML += "<h2>" + post.title + "</h2>";
    viewEl.innerHTML += "<p>" + post.content + "</p>";
    viewEl.innerHTML += "<br/>";
  });
}
