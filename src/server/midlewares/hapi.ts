import { MiddlewareFactory } from "./MiddlewareFactory";
// @ts-ignore
import HapiAdapter = require("@universal-adapter/hapi");

export const telefunc = MiddlewareFactory(HapiAdapter, "hapi", {
  useOnPreResponse: true,
});
