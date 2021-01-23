import { telefuncServer } from "./global-instance";
export const server = telefuncServer.telefunctions;
export const { config } = telefuncServer;
export const { getApiHttpResponse } = telefuncServer;
export const { setSecretKey } = telefuncServer;
export { addContext } from "telefunc/context/server/addContext";
//@ts-ignore
export { context } from "telefunc/context/contextUntyped";
