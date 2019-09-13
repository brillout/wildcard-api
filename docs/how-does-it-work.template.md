!INLINE ./header.md --hide-source-path
&nbsp;

# How Does It Work

When calling `endpoints.myEndpoint('some', {arg: 'val'});` in the browser, the following happens:

1. [Browser]
   The arguments are serialized to the string `'["some",{"arg":"val"}]'`
   and an HTTP request is made to `/wildcard/myEndpoint/["some",{"arg":"val"}]`.
   (Serialization is done with [JSON-S](https://github.com/brillout/json-s).)

2. [Node.js]
   The arguments are deserialized
   and your endpoint function (defined on `endpoints.myEndpoint` in Node.js) is called.

3. [Node.js]
   Once your endpoint function's promise resolves,
   the resolved value is serialized and sent to the browser in an HTTP response.

5. [Browser]
   The received HTTP response is deserialized and the promise of the original `endpoints.myEndpoint` call is resolved.
