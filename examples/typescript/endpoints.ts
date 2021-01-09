import { server, getContext } from "telefunc/server";
import { Context } from "./context";
import { context } from "telefunc/server";

console.log("abc", context);

export type PersonTelefuncs = typeof personTelefuncs;
const personTelefuncs = {
  getPerson,
};
Object.assign(server, personTelefuncs);

type Person = {
  firstName: string;
  lastName: string;
  id: number;
};

const persons: Array<Person> = [
  { firstName: "John", lastName: "Smith", id: 0 },
  { firstName: "Alice", lastName: "Graham", id: 1 },
  { firstName: "Harry", lastName: "Thompson", id: 2 },
];

async function getPerson(id: number): Promise<Person | null> {
  const context = getContext<Context>();
  if (!context.isLoggedIn) {
    context.isLoggedIn = true;
    return null;
  }
  return persons.find((person) => person.id === id) || null;
}
