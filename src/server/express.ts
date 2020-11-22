import { MiddlewareFactory } from "./MiddlewareFactory";
// @ts-ignore
import ExpressAdapter = require("@universal-adapter/express");
import { RequestHandler, Request } from "express";

type ExpressMiddleware = RequestHandler;
/** The request object `req` provided by Express. */
type HttpRequest = Request;

export const wildcard = MiddlewareFactory<ExpressMiddleware, HttpRequest>(
  ExpressAdapter,
  "express"
);
