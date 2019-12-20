import wildcard from '@wildcard-api/server';

interface Person {
  firstName: string;
  lastName: string;
  id: number;
}

const persons : Array<Person> = [
  {firstName: 'John', lastName: 'Smith', id: 0},
  {firstName: 'Alice', lastName: 'Graham', id: 1},
  {firstName: 'Harry', lastName: 'Thompson', id: 2},
];

async function getPerson(id: number): Promise<Person> {
  return persons.find(person => person.id===id);
};

const endpoints = {
  getPerson,
};
export type Endpoints = typeof endpoints;

Object.assign(wildcard.endpoints, endpoints);
