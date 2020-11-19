import { server as _server, FrontendType } from "telefunc/server";
import { Context } from "./context";

interface Person {
  firstName: string;
  lastName: string;
  id: number;
}

const persons: Array<Person> = [
  { firstName: "John", lastName: "Smith", id: 0 },
  { firstName: "Alice", lastName: "Graham", id: 1 },
  { firstName: "Harry", lastName: "Thompson", id: 2 },
];

async function getPerson(this: Context, id: number) {
  if (!this.isLoggedIn) return null;
  return persons.find((person) => person.id === id) || null;
}

const server = {
  getPerson,
};
export type Server = FrontendType<typeof server, Context>;

Object.assign(_server, server);
