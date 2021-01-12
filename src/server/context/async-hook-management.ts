import asyncHooks = require("async_hooks");
import { IncomingMessage } from "http";
import {
  ContextObject,
  HttpRequestHeaders,
  HttpRequestMethod,
  HttpRequestUrl,
  HttpRequestProps,
} from "../TelefuncServer";
import { assert, assertUsage } from "../utils/assert";

export { getContextHook };
export { ContextHook };
export { createContextHookFallback };
export { deleteContextHookFallback };

//type AsyncId = number & { _brand?: "AsyncId" };
type AsyncId = number;
type ContextHook = {
  asyncId: AsyncId;
  descendents: AsyncId[];
  // getRequestProps: () => Promise<HttpRequestProps>;
  getRequestHeaders: () => HttpRequestHeaders | null;
  contextProxy: ContextObject | null;
  contextModifications_: ContextObject;
  userDefinedContext: ContextObject;
  isFallbackHook: boolean;
};
interface ParsedIncomingMessage extends IncomingMessage {
  complete: true;
  url: HttpRequestUrl;
  method: HttpRequestMethod;
  headers: HttpRequestHeaders;
}
const contextHooks: Record<AsyncId, ContextHook> = {};
const contextHooksMap: Record<AsyncId, AsyncId> = {};
function createContextHookFallback(requestProps: HttpRequestProps | null) {
  if (getContextHook()) return;

  const asyncId = asyncHooks.executionAsyncId();
  const contextHookId = asyncHooks.triggerAsyncId();
  /*
    const getRequestProps = () => {
      assert(requestProps);
      return Promise.resolve(requestProps);
    };
    */
  const getRequestHeaders = () => {
    if (!requestProps) {
      // TODO
      return null;
    }
    assert(requestProps.headers); // TODO
    return requestProps.headers;
  };
  createContextHook(contextHookId, true, getRequestHeaders);
  addDescendent(contextHookId, asyncId);
}
function deleteContextHookFallback(contextHook: ContextHook) {
  if (contextHook.isFallbackHook) {
    deleteContextHook(contextHook.asyncId);
  }
}
function createContextHook(
  contextHookId: AsyncId,
  isFallbackHook: boolean,
  getRequestHeaders: () => HttpRequestHeaders | null
): ContextHook {
  assert(!(contextHookId in contextHooks));
  const contextHook: ContextHook = {
    asyncId: contextHookId,
    getRequestHeaders,
    descendents: [],
    contextProxy: null,
    contextModifications_: {},
    userDefinedContext: {},
    isFallbackHook,
  };
  contextHooks[contextHookId] = contextHook;
  addDescendent(contextHookId, contextHookId);
  return contextHook;
}
function deleteContextHook(contextHookId: AsyncId) {
  const contextHook = contextHooks[contextHookId];

  const modificationsLeft = Object.keys(contextHook.contextModifications_);
  assertUsage(
    modificationsLeft.length === 0,
    [
      "You are trying to change the context values of ",
      modificationsLeft
        .map((contextProp) => `context.${contextProp}\``)
        .join(" "),
      "outside of a telefunction,",
      "but context can only be changed within the context of a telefunction call.",
    ].join(" ")
  );

  for (const id of contextHook.descendents) {
    assert(contextHooksMap[id] === contextHookId);
    delete contextHooksMap[id];
  }
  delete contextHooks[contextHookId];
}
function addDescendent(contextHookId: AsyncId, asyncId: AsyncId) {
  contextHooks[contextHookId].descendents.push(asyncId);
  assert(!(asyncId in contextHooksMap));
  contextHooksMap[asyncId] = contextHookId;
}
function installAsyncHook() {
  const asyncHook = asyncHooks.createHook({
    init: (
      asyncId: AsyncId,
      type: string,
      triggerAsyncId: AsyncId,
      resource: unknown
    ) => {
      if (type === "HTTPINCOMINGMESSAGE") {
        const incomingMsg = resource as IncomingMessage;
        assert(incomingMsg);
        /*
          const getRequestProps = async (): Promise<HttpRequestProps> => {
            const req = getParsedReq(incomingMsg);
            const { url, method, headers } = req;
            const body = await bodyParser(req);
            return { url, method, headers, body };
          };
          */
        // inspectIncomingMessage(incomingMsg);
        const getRequestHeaders = (): HttpRequestHeaders => {
          // inspectIncomingMessage(incomingMsg);
          const req = getParsedReq(incomingMsg);
          const { headers } = req;
          assert(headers);
          return headers;
        };
        createContextHook(asyncId, false, getRequestHeaders);
      } else {
        const contextHookId = contextHooksMap[triggerAsyncId];
        if (contextHookId) addDescendent(contextHookId, asyncId);
      }
    },
    destroy: (asyncId: AsyncId) => {
      if (!(asyncId in contextHooks)) return;
      const contextHookId = asyncId;
      deleteContextHook(contextHookId);
    },
  });
  asyncHook.enable();
}
installAsyncHook();

function getContextHook(): ContextHook | null {
  const asyncId = asyncHooks.executionAsyncId();
  const contextHookId = contextHooksMap[asyncId];
  if (!contextHookId) return null;
  const httpRequest = contextHooks[contextHookId];
  assert(httpRequest);
  return httpRequest;
}

function inspectIncomingMessage(incomingMsg: IncomingMessage) {
  console.log("incomingMsg.url");
  console.log((incomingMsg as any).url);
  console.log("incomingMsg.complete");
  console.log((incomingMsg as any).complete);
  console.log("incomingMsg.type");
  console.log((incomingMsg as any).type);
  console.log("Object.keys(incomingMsg)");
  console.log(Object.keys(incomingMsg));
  const hasParser = "parser" in (incomingMsg as any).socket;
  console.log("'parser' in incomingMsg.socket");
  console.log(hasParser);
  if (hasParser) {
    console.log("incomingMsg.socket.parser.incoming.complete");
    console.log((incomingMsg as any).socket.parser.incoming.complete);
    console.log("incomingMsg.socket.parser.incoming.url");
    console.log((incomingMsg as any).socket.parser.incoming.url);
    console.log("incomingMsg.socket.parser.incoming.method");
    console.log((incomingMsg as any).socket.parser.incoming.method);
    console.log("incomingMsg.socket.parser.incoming.headers");
    console.log((incomingMsg as any).socket.parser.incoming.headers);
  }
}
function getParsedReq(incomingMsg: IncomingMessage): ParsedIncomingMessage {
  const req = (incomingMsg?.socket as any)?.parser?.incoming;
  assert(req.complete === true);
  assert(typeof req.url === "string");
  assert(typeof req.method === "string");
  assert(req.headers && Object.keys(req.headers).length >= 0);
  return req;
}
