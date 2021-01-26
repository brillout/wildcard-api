import { UserWithPassword } from "./types";
import { readJson } from "fs-extra";
const dataFile = require.resolve("./data.json");

export { findUser };

async function findUser(
  email: string,
  password: string
): Promise<UserWithPassword | null> {
  const users = (await readJson(dataFile)) as UserWithPassword[];
  const user = users.find(
    (user) => user.email === email && user.password === password
  );
  return user || null;
}
