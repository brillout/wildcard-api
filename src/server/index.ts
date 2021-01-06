import { telefuncServer } from "./global-instance";
export const server = telefuncServer.endpoints;
export const { config } = telefuncServer;
export const { getApiHttpResponse } = telefuncServer;
export const { setSecretKey } = telefuncServer;
// TODO remove
export const { getContextFromCookie } = telefuncServer;
export const { getContext } = telefuncServer;
export { FrontendType } from "./TelefuncServer";
