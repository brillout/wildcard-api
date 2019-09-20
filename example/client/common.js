import "babel-polyfill";
import {endpoints} from 'wildcard-api/client';

/*
import wildcardClient from 'wildcard-api/client';
wildcardClient.argumentsAlwaysInHttpBody = true;
*/

// Make endpoints available to play with in the dev console
window.endpoints = endpoints;
