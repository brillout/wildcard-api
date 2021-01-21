import "babel-polyfill";
import { Server } from "../main.telefunc";
import { server as serverUntyped } from "telefunc/client";
const server = serverUntyped as Server;

main();

async function main() {
  const posts = await server.getPosts();
  const viewEl = document.getElementById("view");
  posts.forEach((post) => {
    viewEl.innerHTML += "<h2>" + post.title + "</h2>";
    viewEl.innerHTML += "<p>" + post.content + "</p>";
    viewEl.innerHTML += "<br/>";
  });
}
