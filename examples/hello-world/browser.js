import { server } from "telefunc/client";

main();

async function main() {
  const msg = await server.hello("Elisabeth");
  document.body.innerHTML += msg;
}
