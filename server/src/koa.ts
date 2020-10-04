import { MiddlewareFactory } from "./MiddlewareFactory";
import KoaAdapter = require("@universal-adapter/koa");

export const wildcard = MiddlewareFactory(KoaAdapter);

// TODO remove default export
export default wildcard;
