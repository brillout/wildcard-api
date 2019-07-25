const express = require('express');
const {getApiResponse} = require('wildcard-api');
require('./api/endpoints');

const app = express();

app.all('/wildcard/*' , async (req, res) => {
  const requestProps = {
    url: req.url,
    method: req.method,
    body: req.body,
    // All requestProps are available to your endpoint functions as `this`.
    // For example, if you want to access the HTTP request headers in your endpoint functions:
    //    requestProps.headers = req.headers;
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
