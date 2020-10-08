import { MiddlewareFactory } from "./MiddlewareFactory";
// @ts-ignore
import KoaAdapter = require("@universal-adapter/koa");

export const wildcard = MiddlewareFactory(KoaAdapter, "koa");
