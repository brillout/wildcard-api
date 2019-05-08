const express = require('express');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = express();

app.all('/wildcard/*' , (req, res, next) => {
  // Our request object `req` is available to endpoint functions over `this`.
  // That is `this===req`. For example:
  // `endpoints.getUser = function() { return getLoggedUser(this.headers.cookies) }`.
  getApiResponse(req)
  .then(apiResponse => {
    res.status(apiResponse.statusCode);
    res.type(apiResponse.type);
    res.send(apiResponse.body);
    next();
  })
  .catch(next);
});

// Serve our frontend
app.use(express.static('client/dist', {extensions: ['html']}));

app.listen(3000);

console.log('Server is running. Go to http://localhost:3000')
