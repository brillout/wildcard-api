import * as asyncHooks from "async_hooks";
import { IncomingMessage } from "http";
import {
  ContextObject,
  HttpRequestHeaders,
  HttpRequestMethod,
  HttpRequestUrl,
  HttpRequestProps,
} from "telefunc/server/TelefuncServer";
import {
  assert,
  assertUsage,
  assertWarning,
  requestForContact,
} from "telefunc/server/utils/assert";

export { getContextHook };
export { ContextHook };
export { createContextHookFallback };
export { deleteContextHookFallback };
export { noPendingHooks };

const contextHooks: Record<AsyncId, ContextHook> = {};
const contextHooksMap: Record<AsyncId, AsyncId> = {};

installAsyncHook();

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
  dateCreated: Date;
};

function getContextHook(): ContextHook | null {
  const asyncId = asyncHooks.executionAsyncId();
  const contextHookId = contextHooksMap[asyncId];
  if (!contextHookId) return null;
  const httpRequest = contextHooks[contextHookId];
  assert(httpRequest);
  return httpRequest;
}

function installAsyncHook() {
  const asyncHook = createAsyncHook();
  asyncHook.enable();
}
function createAsyncHook() {
  return asyncHooks.createHook({
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
}
let garbageCollector: NodeJS.Timeout | undefined;
function deleteGarbageCollector() {
  if (!garbageCollector) return;
  if (Object.keys(contextHooks).length !== 0) return;
  clearInterval(garbageCollector);
  garbageCollector = undefined;
}
function enableGarbageCollector() {
  if (garbageCollector) return;

  const TEN_MINUTES = 10 * 60 * 1000;

  garbageCollector = setInterval(collectGarbage, TEN_MINUTES);

  function collectGarbage() {
    for (const asyncId in contextHooks) {
      const contextHook = contextHooks[asyncId];
      if (
        new Date().getTime() - contextHook.dateCreated.getTime() >
        TEN_MINUTES
      ) {
        delete contextHooks[asyncId];
        assertWarning(
          false,
          `Context prematurely deleted. ${requestForContact}`
        );
      }
    }
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
    dateCreated: new Date(),
  };
  contextHooks[contextHookId] = contextHook;

  addDescendent(contextHookId, contextHookId);

  enableGarbageCollector();

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

  deleteGarbageCollector();
}
function addDescendent(contextHookId: AsyncId, asyncId: AsyncId) {
  contextHooks[contextHookId].descendents.push(asyncId);
  assert(!(asyncId in contextHooksMap));
  contextHooksMap[asyncId] = contextHookId;
}

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

interface ParsedIncomingMessage extends IncomingMessage {
  complete: true;
  url: HttpRequestUrl;
  method: HttpRequestMethod;
  headers: HttpRequestHeaders;
}
function getParsedReq(incomingMsg: IncomingMessage): ParsedIncomingMessage {
  const req = (incomingMsg?.socket as any)?.parser?.incoming;
  assert(req.complete === true);
  assert(typeof req.url === "string");
  assert(typeof req.method === "string");
  assert(req.headers && Object.keys(req.headers).length >= 0);
  return req;
}

function noPendingHooks() {
  return (
    Object.keys(contextHooks).length === 0 &&
    Object.keys(contextHooksMap).length === 0
  );
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
