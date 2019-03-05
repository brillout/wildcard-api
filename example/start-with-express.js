const express = require('express');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = express();

app.all('/wildcard/*' , (req, res, next) => {
  // Our `context` object is made available to endpoint functions over `this`.
  // E.g. `endpoints.getUser = function() { return getLoggedUser(this.headers) }`.
  const {method, url, headers} = req;
  const context = {method, url, headers};
  getApiResponse(context)
  .then(apiResponse => {
    res.status(apiResponse.statusCode);
    res.send(apiResponse.body);
    next();
  })
  .catch(next);
});

// Serve our frontend
app.use(express.static('client/dist', {extensions: ['html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
