import { telefuncServer } from "./global-instance";
export const server = telefuncServer.telefunctions;
export const { config } = telefuncServer;
export const { getApiHttpResponse } = telefuncServer;
export { getContext } from './getContext'
export { createTelefuncCaller } from "./createTelefuncCaller";
