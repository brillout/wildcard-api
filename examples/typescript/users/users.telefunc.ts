import { context } from "telefunc/server";
import { findUser } from "./db";

export { login };

async function login(
  email: string,
  password: string
): Promise<{ wrongCredentials: true } | void> {
  const user = await findUser(email, password);
  if (!user) return { wrongCredentials: true };
  context.user = {
    name: user.name,
    id: user.id,
  };
}
