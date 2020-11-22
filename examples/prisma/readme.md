This example showcases the usage of Telefunc and [Photon](https://github.com/prisma/photonjs) with database types used directly in the frontend code!

Photon automatically generates types for the data model `Post` which we use on the frontend:

<p align="center">
  <a href="#readme">
    <img src="/examples/prisma/screenshots/types-on-frontend.png" width="850" height="279">
  </a>
</p>

We share the types with the frontend by using Telefunc's [TypeScript support](/../../#typescript).

To run the example:

1. Install dependencies.
  ~~~bash
  yarn
  ~~~

2. Build the frontend and start the server.
  ~~~bash
  yarn start
  ~~~

3. Go to [http://localhost:3000](http://localhost:3000).
