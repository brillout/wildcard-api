import "babel-polyfill";
import { server } from "telefunc/client";
import { Hello } from "./hello.telefunc";

const hello = server.hello as Hello;

main();

async function main() {
  const msg = await hello("Alice");
  document.body.innerHTML += msg;
}
