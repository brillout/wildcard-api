const express = require('express');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

start();

async function start() {
  const app = express();

  app.all('/wildcard/*' , async(req, res, next) => {
    // `context` is made available to endpoint functions over `this`
    // E.g. `endpoints.getUser = function() { return getLoggedUser(this.headers) }`
    const {method, url, headers} = req;
    const context = {method, url, headers};
    const apiResponse = await getApiResponse(context);

    if( apiResponse ) {
      res.status(apiResponse.statusCode);
      res.send(apiResponse.body);
    }

    next();
  });

  // Serve the frontend
  app.use(express.static('client/dist', {extensions: ['html']}));

  app.listen(3000);
}
