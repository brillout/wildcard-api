import "babel-polyfill";
import { Endpoints } from "../endpoints";
import { endpoints as endpointsUntyped } from "@wildcard-api/client";

export const endpoints: Endpoints = endpointsUntyped;

(async () => {
  const id = Math.floor(Math.random()*3);
  const person = await endpoints.getPerson(id);
  const personHtml = person.firstName + ' ' + person.lastName + ' <b>(' + person.id + ')</b>';
  document.body.innerHTML = personHtml;
})();
