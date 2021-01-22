import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export { seed };

async function seed() {
  const users = await prisma.user.findMany();

  if (users.length > 0) return;

  await prisma.user.create({
    data: {
      email: "alice@prisma.io",
      name: "Alice",
      posts: {
        create: {
          title: "Watch the talks from Prisma Day 2019",
          content: "https://www.prisma.io/blog/z11sg6ipb3i1/",
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      email: "bob@prisma.io",
      name: "Bob",
      posts: {
        create: [
          {
            title: "Subscribe to GraphQL Weekly for community news",
            content: "https://graphqlweekly.com/",
          },
          {
            title: "Follow Prisma on Twitter",
            content: "https://twitter.com/prisma/",
          },
        ],
      },
    },
  });
}
