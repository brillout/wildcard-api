const express = require('express');
const wildcardMiddleware = require('@wildcard-api/server/express');
const {endpoints} = require('@wildcard-api/server');

endpoints.hello = async function() {
  const msg = 'Hello from server';
  return msg;
};

const app = express();

app.use(wildcardMiddleware());
app.listen(3000);
