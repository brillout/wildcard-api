import { MiddlewareFactory } from "./MiddlewareFactory";
// @ts-ignore
import KoaAdapter = require("@universal-adapter/koa");

export const telefunc = MiddlewareFactory(KoaAdapter, "koa");
