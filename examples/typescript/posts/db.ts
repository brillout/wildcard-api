import { Post } from "./types";
import { readJson } from "fs-extra";
const dataFile = require.resolve("./data.json");

export { getPostsByAuthor };

async function getPostsByAuthor(userId: number): Promise<Post[]> {
  let posts = (await readJson(dataFile)) as Post[];
  posts = posts.filter((post) => post.authorId === userId);
  return posts;
}
