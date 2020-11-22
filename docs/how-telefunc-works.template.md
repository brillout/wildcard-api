!INLINE ./snippets/header.md --hide-source-path
&nbsp;

# How Telefunc Works

Telefunc abstracts away the communication protocol.
We believe it to be an internal implementation detail that you shouldn't care about.
Telefunc currently uses HTTP and JSON but we will eventually change to a more efficient technologies.
This change will happen in a (mostly) backwards compatible way.

In short, think in terms of JavaScript functions and don't worry about details like HTTP verbs.

That said, if you are curious, we now explain how Telefunc currently works.

When calling `endpoints.myEndpoint('some', {arg: 'val'})` in the browser,
the following happens:

1. [Browser]
   The arguments are serialized to the string `'["some",{"arg":"val"}]'`
   and an HTTP request is made to `/_telefunc/myEndpoint/["some",{"arg":"val"}]`.
   (Serialization is done with [JSON-S](https://github.com/brillout/json-s).)

2. [Node.js]
   The arguments are deserialized
   and your endpoint function (defined on `endpoints.myEndpoint` in Node.js) is called.

3. [Node.js]
   Once your endpoint function's promise resolves,
   the resolved value is serialized and sent to the browser in an HTTP response.

5. [Browser]
   The received HTTP response is deserialized and the promise of the original `endpoints.myEndpoint('some', {arg: 'val'})` call is resolved.

!INLINE ./snippets/section-footer.md #readme --hide-source-path
