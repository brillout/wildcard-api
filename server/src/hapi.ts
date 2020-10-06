import { MiddlewareFactory } from "./MiddlewareFactory";
import HapiAdapter = require("@universal-adapter/hapi");

export const wildcard = MiddlewareFactory(HapiAdapter, "hapi", {
  useOnPreResponse: true,
});
