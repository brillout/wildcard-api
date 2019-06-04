<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=80 alt="Wildcard API"/>
  </a>
</p>

<p align="center">Function as an API</p>
&nbsp;


# SSR & Authentication

SSR works out of the box.

But with one exception:
if your endpoint functions need request information,
then you'll need to `bind()` the request object.

Most notably when you have authentication/authorization, then you'll need to `bind()`.

For example:

~~~js
// Node.js

const {endpoints} = require('wildcard-api');
const getLoggedUser = require('./path/to/your/auth/code');

endpoints.whoAmI = async function() {
  // This endpoint requires the HTTP headers
  const user = await getLoggedUser(this.headers.cookie);
  return 'You are '+user.name;
};
~~~

The `whoAmI` endpoint always needs the HTTP headers.
(When the Wildcard client runs in the browser as well as when the Wildcard client runs in Node.js.)

We need to provide that request information while doing SSR:

~~~js
// Browser + Node.js

const {endpoints} = require('wildcard-api/client');

// `req` should be the HTTP request object. (Provided by your server framework.)
module.exports = async req => {
  let {whoAmI} = endpoints;

  if( isNodejs() ) {
    // We use `Function.prototype.bind()` to pass the
    // request object `req` to our endpoint `whoAmI`.
    whoAmI = whoAmI.bind(req);
  }

  const userName = await whoAmI();
};

function isNodejs() {
  return typeof window === "undefined";
}
~~~

That way, `whoAmI` always has access to the request object `req`:
when run in the browswer,
`req` originates from `getApiResponse`,
and when run in Node.js,
`req` originates from our `bind` call above.
The request object `req` is then always available to `whoAmI` as `this`.

(When used in the browser, the Wildcard client makes an HTTP request to your server which calls `getApiResponse`.
But when used in Node.js, the Wildcard client directly calls your endpoint function, without doing any HTTP request.
That's why you need to `bind()` the request object.)

> You can scaffold an app that has SSR + Wildcard by using
> [Reframe's react-sql starter](https://github.com/reframejs/reframe/tree/master/plugins/create/starters/react-sql#readme)


<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/ssr-auth.template.md` instead.






-->
