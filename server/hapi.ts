import { MiddlewareFactory } from "./MiddlewareFactory";
// @ts-ignore
import HapiAdapter = require("@universal-adapter/hapi");

export const wildcard = MiddlewareFactory(HapiAdapter, "hapi", {
  useOnPreResponse: true,
});
