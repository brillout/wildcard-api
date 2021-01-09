import "babel-polyfill";
import { PersonTelefuncs } from "../endpoints";
import { server } from "telefunc/client";

const personTelefuncs = server as PersonTelefuncs;

(async () => {
  const id = Math.floor(Math.random() * 3);
  const person = await personTelefuncs.getPerson(id);
  if (person === null) {
    document.body.innerHTML = "Could not retrieve person";
  } else {
    const personHtml =
      person.firstName + " " + person.lastName + " <b>(" + person.id + ")</b>";
    document.body.innerHTML = personHtml;
  }
})();
