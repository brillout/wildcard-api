### `onEndpointCall`

The `require('wildcard-api').onEndpointCall` hook allows you to intercept and listen to all endpoint calls.

This gives you full control.
To do things such as logging or custom error handling:

~~~js
const wildcardApi = require('wildcard-api');

wildcardApi.onEndpointCall = ({
  // The HTTP request object
  req,

  // The name of the endpoint that has been called
  endpointName,

  // The arguments passed to the endpoint
  endpointArgs,

  // The error thrown by the endpoint function, if any
  endpointError,

  // The value returned by the endpoint function
  endpointResult,

  // Overwrite the value returned by the endpoint function
  overwriteResult,

  // Overwrite the HTTP response of the endpoint
  overwriteResponse,
}) => {
  // For example, logging:
  console.log('New call to '+endpointName+' from User Agent '+req.headers['user-agent']);

  // If you want to overwrite the endpoint result:
  overwriteResult({message: 'this is an overwriting message'});

  // Or if you want to custom handle server errors:
  if( endpointError ) {
    overwriteResponse({
      statusCode: 500,
      contentType: 'text/html',
      body: "<html><body><b>There was an internal error. We have been notified.</b><body><html/>",
    });
  }
};
~~~

See [test/tests/onEndpointCall.js](/test/tests/onEndpointCall.js) for usage examples.
