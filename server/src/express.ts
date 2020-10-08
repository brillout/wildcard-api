import { MiddlewareFactory } from "./MiddlewareFactory";
import ExpressAdapter = require("@universal-adapter/express");
import { RequestHandler } from "express";

export const wildcard = MiddlewareFactory<RequestHandler>(
  ExpressAdapter,
  "express"
);
