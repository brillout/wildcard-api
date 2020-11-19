import "babel-polyfill";
import { Server } from "../endpoints";
import { server as serverUntyped } from "telefunc/client";

const server = serverUntyped as Server;

(async () => {
  const id = Math.floor(Math.random() * 3);
  const person = await server.getPerson(id);
  if (person === null) {
    document.body.innerHTML = "Could not retrieve person";
  } else {
    const personHtml =
      person.firstName + " " + person.lastName + " <b>(" + person.id + ")</b>";
    document.body.innerHTML = personHtml;
  }
})();
