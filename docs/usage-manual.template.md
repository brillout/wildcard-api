!MENU_ORDER 2
!INLINE ./header.md --hide-source-path
!MENU

# Usage Manual

 - [API](#api)
 - [SSR](#ssr)
 - [Error Handling](#error-handling)
 - [Custom API vs Generic API (Wildcard API vs GraphQL/RESTful API)](/docs/usage-manual.md#custom-api-vs-generic-api-wildcard-api-vs-graphql-restful-api)


<br/>

## Custom API vs Generic API (Wildcard API vs GraphQL/RESTful API)

> TLDR;
>  - If you have a tight client-API development, then use a custom API.
>  - If you need to decouple client development from API development, then use a generic API.
>  - Start your prototype with a custom API, then progressively replace it with a generic API

Comparing Wildcard with REST and GraphQL mostly boilds down to comparing a custom API with a generic API.

With custom API we denote an API that is designed to fulfill only the data requirements of your clients.
For example:
 - Wildcard API (following the [Tailored Approach](#tailored-approach))
 - [REST level 0](https://martinfowler.com/articles/richardsonMaturityModel.html#level0) API

With generic API we denote an API that is designed to support a maximum number of data requirements.
For example:
 - GraphQL API
 - RESTful API (following at least [REST level 1](https://martinfowler.com/articles/richardsonMaturityModel.html#level1))

#### Contents

 - [Tight client-API development](#tight-client-api-development)
 - [Use Cases - Custom API](#use-cases--custom-api)
 - [Use Cases - Generic API](#use-cases--generic-api)

