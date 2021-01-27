import { server } from "telefunc/server";

export type Hello = typeof hello;

Object.assign(server, { hello });

async function hello(name: string): Promise<string> {
  return `Hello ${name}, welcome to Telefunc.`;
}
