import { telefuncServer } from "./global-instance";
export const server = telefuncServer.telefunctions;
export const { config } = telefuncServer;
export const { getApiHttpResponse } = telefuncServer;
export const { setSecretKey } = telefuncServer;
//@ts-ignore
export { context } from "./contextUntyped.js";
