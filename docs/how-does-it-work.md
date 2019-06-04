<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/brillout/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=80 alt="Wildcard API"/>
  </a>
</p>

<p align="center">Function as an API</p>
&nbsp;

# How does it work

When calling `endpoints.endpointName('some', {arg: 'val'});` in the browser, the following happens:

1. [Browser]
   The arguments are serialized to `'["some",{"arg":"val"}]'`
   and an HTTP request is made to `/wildcard/endpointName/["some",{"arg":"val"}]`.
   (Serialization is done with [JSON-S](https://github.com/brillout/json-s).)

2. [Node.js]
   The arguments are deserialized
   and your endpoint function (defined on `endpoints.endpointName` in Node.js) is called.

3. [Node.js]
   Once your endpoint function's promise resolves,
   the resolved value is serialized and sent to the browser in an HTTP response.

5. [Browser]
   The received HTTP response is deserialized and the promise of the original `endpoints.endpointName` call is resolved.

<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Edit `/docs/how-does-it-work.template.md` instead.






-->
