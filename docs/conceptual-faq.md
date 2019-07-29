<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).






-->
<p align="center">
  <a href="/../../#readme">
    <img src="https://github.com/reframejs/wildcard-api/raw/master/docs/images/logo-with-text.svg?sanitize=true" height=96 alt="Wildcard API"/>
  </a>
</p>
&nbsp;


# Conceptual FAQ

- [How does Wildcard compare to GraphQL/REST?](#how-does-wildcard-compare-to-graphqlrest)
- [Isn't GraphQL more powerful than Wildcard?](#isnt-graphql-more-powerful-than-wildcard)
- [I can create a custom API myself, do I need Wildcard?](#i-can-create-a-custom-api-myself-do-i-need-wildcard)
- [Isn't Wildcard just RPC?](#isnt-wildcard-just-rpc)



### How does Wildcard compare to GraphQL/REST?

They have different goals.

With GraphQL/REST you create a *generic API*:
an API that aims to be able to fulfill a maximum number of data requirements;
enabling third parties to build applications on top of your data.
If your goal is to have an ecosystem of third-party applications,
then you need a generic API and you'll have to use something like REST/GraphQL.

With Wildcard you create a *custom API*:
an API that fulfills the data requirements of your clients and your clients only.
If your goal is to retrieve and mutate data from your frontend,
then Wildcard offers a simple alternative.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users!
</sup>

<br/>

<sup>
<a href="#conceptual-faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### Isn't GraphQL more powerful than Wildcard?

Yes and no.

From the perspective of a third party,
yes,
GraphQL is more powerful.

But,
from the perspective of your frontend development,
things are different.

While developing your frontend,
everything the backend can do is only one JavaScript function away:

~~~js
// Your Node.js server

const endpoints = require('wildcard-api');

endpoints.iHavePower = function() {
  // I can do anything the Node.js server can do
};
~~~
~~~js
// Your browser frontend

const endpoints = require('wildcard-api/client');

// The backend power is one JavaScript function away
endpoints.iHavePower();
~~~

The whole power of your backend is at your disposal while developing your frontend.
For example,
you can use any NoSQL/SQL/ORM query to retrieve and mutate data.
That's arguably more powerful than GraphQL.

(The distinctive difference is that,
from the perspective of a third party,
your custom API is set in stone
but,
from your perspective,
your custom API can be modified at will while developing your frontend.)

GraphQL is a wonderful addition to our developer toolbox.
Unfortunately,
GraphQL's hype makes us forget how great custom APIs are.
Let's remember.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users!
</sup>

<br/>

<sup>
<a href="#conceptual-faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### I can create a custom API myself, do I need Wildcard?

Instead of Wildcard,
you can create a custom API yourself by manually adding HTTP routes to your web server.

Wildcard is just a little tool that takes care of:
 - Serialization
 - Caching
 - SSR

If you want control over these things,
then don't use Wildcard.
But beaware that it's less trivial than you might think.
(For example we use [JSON-S](https://github.com/brillout/json-s) instead of JSON.)


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users!
</sup>

<br/>

<sup>
<a href="#conceptual-faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>



### Isn't Wildcard just RPC?

Yes,
Wildcard is basically
[RPC](https://en.wikipedia.org/wiki/Remote_procedure_call)
between your browser frontend and your Node.js server.

RPC existed long before REST.
(Xerox PARC being among the first to implement RPC in the early 1980s
while REST was introduced only in the early 2000s.)

So, why should one use RPC instead of REST/GraphQL today?

When REST came out,
it allowed internet companies
to expose their data
to third parties in a safe and standardized way.
Large companies
soon realized the potential:
a RESTful API
allowed them
to become platforms with
a flurishing ecosystem
of third-party applications built on top of their RESTful API.
REST soon became the de facto standard for public APIs.

GraphQL is a great step forward:
it allows third parties to retrieve data that were previously difficult (or even not possible) to retrieve with a RESTful API.
GraphQL allows for a even more prospereous ecosystem of third-party applications.
Large companies,
such as Facebook and GitHub,
now expose their data as a GraphQL API,
reinforcing their position as a platform.

If you want to enable an ecosystem of third-party applications built on top of your data,
then setting up a generic API
is an obligatory step
(such as with REST or GraphQL).

This is not Wildcard's use case.
An API created with Wildcard is meant to be consumed by your clients and your clients only.
Such API is not generic and,
from the perspective of a third party,
a Wildcard API doesn't make sense.
(Nor does any custom API or RPC-like API.)

But if your goal is to retrieve/mutate data from your frontend,
then Wildcard
offers a simple alternative.
(So does any custom API or RPC-like API.)

The advent of REST and GraphQL
spur the rise of vast ecosystems of third-party apps.
That's wonderful.
But sadly,
their success is casting a shadow over RPC,
even though RPC is (and always was) a great way of communicating between two remote processes.


<br/>

<p align="center">

<sup>
<a href="https://github.com/reframejs/wildcard-api/issues/new">Open a ticket</a> or
<a href="https://discord.gg/kqXf65G">chat with us</a>
if you have questions, feature requests, or if you just want to talk to us.
</sup>

<sup>
We enjoy talking with our users!
</sup>

<br/>

<sup>
<a href="#conceptual-faq"><b>&#8679;</b> <b>TOP</b> <b>&#8679;</b></a>
</sup>

</p>

<br/>
<br/>




<!---






    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).












    WARNING, READ THIS.
    This is a computed file. Do not edit.
    Instead, edit `/docs/conceptual-faq.template.md` and run `npm run docs` (or `yarn docs`).






-->
