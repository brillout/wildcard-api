import { MiddlewareFactory } from "./MiddlewareFactory";
import ExpressAdapter = require("@universal-adapter/express");

export const wildcard = MiddlewareFactory(ExpressAdapter, "express");
