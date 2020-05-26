import wildcard from "@wildcard-api/server";
import { Photon } from "@prisma/photon";

const photon = new Photon();

const endpoints = {
  getPosts,
};
Object.assign(wildcard.endpoints, endpoints);
export type Endpoints = typeof endpoints;

async function getPosts() {
  const posts = await photon.posts.findMany({ where: { published: true } });
  return posts;
}
