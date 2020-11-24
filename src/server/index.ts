import { telefuncServer } from "./global-instance";
export const server = telefuncServer.endpoints;
export const { config } = telefuncServer;
export const { getApiHttpResponse } = telefuncServer;
export { FrontendType } from "./TelefuncServer";
export { setSecretKey } from "./telefuncSession";
