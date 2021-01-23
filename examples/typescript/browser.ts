import "babel-polyfill";
import { server } from "telefunc/client";

main();

async function main() {
  const id = Math.floor(Math.random() * 3);
  const person = await server.getPerson(id);

  if (person === null) {
    document.body.innerHTML = "Could not retrieve person";
    return;
  }

  const personHtml =
    person.firstName + " " + person.lastName + " <b>(" + person.id + ")</b>";
  document.body.innerHTML = personHtml;
}
