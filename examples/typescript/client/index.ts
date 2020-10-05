import "babel-polyfill";
import { Server } from "../endpoints";
import { server as serverUntyped } from "@wildcard-api/client";

export const server: Server = serverUntyped;

(async () => {
  const id = Math.floor(Math.random() * 3);
  const person = await server.getPerson(id);
  const personHtml =
    person.firstName + " " + person.lastName + " <b>(" + person.id + ")</b>";
  document.body.innerHTML = personHtml;
})();
