import { server } from "telefunc/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type GetPosts = typeof getPosts;

Object.assign(server, { getPosts });

async function getPosts() {
  const posts = await prisma.post.findMany();
  return posts;
}
