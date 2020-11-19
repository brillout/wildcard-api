import { server as _server } from "telefunc/server";
import { Photon } from "@prisma/photon";

const photon = new Photon();

const server = {
  getPosts,
};
Object.assign(_server, server);
export type Server = typeof server;

async function getPosts() {
  const posts = await photon.posts.findMany({ where: { published: true } });
  return posts;
}
