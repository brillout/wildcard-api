import { WildcardClient } from "./WildcardClient";

export { WildcardClient };
export const wildcardClient = new WildcardClient();
export const endpoints = wildcardClient.endpoints;

// TODO: remove default export
export default wildcardClient;
