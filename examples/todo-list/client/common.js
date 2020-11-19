import "babel-polyfill";
import { config, server } from "telefunc/client";

// Make config available to play with in the dev console.
// For example: `window.config.shortUrl = true`;
window.config = config;

// Make server available to play with in the dev console.
window.server = server;
