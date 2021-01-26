import { context } from "telefunc/server";
import { getPostsByAuthor } from "./db";
import { Post } from "./types";

export { getPosts };

async function getPosts(): Promise<Post[] | null> {
  if (!context.user) {
    return null;
  }
  const posts = await getPostsByAuthor(context.user.id);
  return posts;
}
