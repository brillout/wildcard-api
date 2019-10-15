import "babel-polyfill";
import wildcardClient from 'wildcard-api/client';

// Make wildcardClient available to play with in the dev console.
// For example: `window.wildcardClient.argumentsAlwaysInHttpBody = true`;
window.wildcardClient = wildcardClient;

// Make endpoints available to play with in the dev console.
const {endpoints} = wildcardClient;
window.endpoints = endpoints;
