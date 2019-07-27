const assert = require('@brillout/reassert');
const express = require('express');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = express();

app.use(express.json());

app.all('/wildcard/*' , async (req, res) => {
  assert.internal(req.url);
  assert.internal(req.method);
  assert.internal('body' in req);
  assert.internal(req.method!=='POST' || req.body.constructor===Array);
  assert.internal(req.headers.constructor===Object);

  const requestProps = {
    url: req.url,
    method: req.method,
    body: req.body,
    // All requestProps are available to your endpoint functions as `this`.
    // For example, to access the HTTP request headers in your endpoint functions:
    headers: req.headers,
  };

  const responseProps = await getApiResponse(requestProps);

  res.status(responseProps.statusCode);
  res.type(responseProps.contentType);
  res.send(responseProps.body);
});

// Serve our frontend
app.use(express.static('client/dist', {extensions: ['html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
