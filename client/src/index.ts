import { WildcardClient } from "./WildcardClient";

export { WildcardClient };
export const wildcardClient = new WildcardClient();
export const server = wildcardClient.endpoints;
export const { config } = wildcardClient;
