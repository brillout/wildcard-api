import {
  assert,
  assertUsage,
  checkType,
  hasProp,
  isObject,
  isPlainObject,
  objectAssign,
} from "./utils";
import { telefuncServer } from "./global-instance";
import type { HttpResponseProps } from "./TelefuncServer";
import type { ViteDevServer } from "vite";
import { loadTelefuncFiles } from "../vite/loadTelefuncFiles";
import type { Telefunction } from "../server/TelefuncServer";

type CtxEnv =
  | {
      _isProduction: false;
      _viteDevServer: ViteDevServer;
      _root: string;
    }
  | {
      _isProduction: true;
      _viteDevServer: undefined;
      _root?: string;
    };

type HttpRequestMethd = "GET" | "POST";

type CtxRequestProps = {
  _url: string;
  _method: HttpRequestMethd;
  _body: null | string | Record<string, unknown>;
  _headers: null | unknown;
  _headerArray: null | HeaderArray;
  _headerObject: null | HeaderObject;
};

type HeaderArray = { key: string; value: string }[];
type HeaderObject = Record<string, string>;

export { createTelefuncCaller };

function createTelefuncCaller({
  viteDevServer,
  root,
  isProduction,
}: {
  viteDevServer?: ViteDevServer;
  root?: string;
  isProduction?: boolean;
}) {
  const telefuncEnv: CtxEnv = validateArgs(...arguments);

  return callTelefunc;

  async function callTelefunc(
    requestProps: {
      url: string;
      method: string;
      headers?: unknown;
      body?: unknown;
    },
    telefuncContext: Record<string, unknown>
  ): Promise<null | { body: string; statusCode: number }> {
    addRequestProps(telefuncContext, requestProps);
    checkType<CtxRequestProps>(telefuncContext);
    addCtxEnv(telefuncContext, telefuncEnv);
    checkType<CtxEnv>(telefuncContext);

    assert(telefuncContext._viteDevServer); // TODO

    const telefuncFiles = await loadTelefuncFiles(telefuncContext);
    Object.values(telefuncFiles).forEach((telefuncFileExports) => {
      Object.keys(telefuncFileExports).forEach((telefunctionName) => {
        telefuncServer.telefunctions[telefunctionName] = telefuncFileExports[
          telefunctionName
        ] as Telefunction;
      });
    });

    const httpResponse: null | HttpResponseProps =
      //await telefuncServer.getApiHttpResponse(telefuncContext, telefuncContext);
      await telefuncServer.getApiHttpResponse(
        requestProps as any,
        telefuncContext
      );
    // console.log("tt", telefuncContext);
    return httpResponse;
  }
}

type RequestProps = Parameters<ReturnType<typeof createTelefuncCaller>>[0];
function addRequestProps<Ctx extends Record<string, unknown>>(
  telefuncContext: Ctx,
  requestProps: RequestProps
): asserts telefuncContext is Ctx & CtxRequestProps {
  assertUsage(
    hasProp(requestProps, "url", "string"),
    "`callTelefunc({ url })`: argument `url` should be a string."
  );
  const methods: ("GET" | "POST")[] = ["GET", "POST"];
  assertUsage(
    hasProp(requestProps, "method", methods),
    "`callTelefunc({ method })`: argument `method` should be `method === 'GET' || method === 'POST'`."
  );

  let _body: null | string | Record<string, unknown>;
  if (!("body" in requestProps)) {
    _body = null;
  } else {
    const { body } = requestProps;
    assertUsage(
      body !== undefined && body !== null,
      "`callTelefunc({ body })`: argument `body` should be a string or an object but `body === " +
        body +
        "`. Note that with some server frameworks, such as Express.js and Koa, you need to use a server middleware that parses the body."
    );
    assertUsage(
      typeof body === "string" || isObject(body),
      "`callTelefunc({ body })`: argument `body` should be a string or an object but `typeof body === '" +
        typeof body +
        "'`. (Server frameworks, such as Express.js, provide the body as object if the HTTP request body is already JSON-parsed, or as string if not.)"
    );
    _body = body;
  }
  const _bodyString = typeof _body === "string" ? _body : JSON.stringify(_body);

  let _headers: null | HeaderArray | HeaderObject;
  if (!("headers" in requestProps)) {
    _headers = null;
  } else {
    const { headers } = requestProps;
    assertUsage(
      isHeaders(headers),
      "`callTelefunc({ headers })`: argument `headers` should be an object of strings (`Record<string, string>`) or a an array of `{ key: string, value: string }`."
    );
    _headers = headers;
  }
  const { headerArray, headerObject } = parseHeaders(_headers);

  objectAssign(telefuncContext, {
    _url: requestProps.url,
    _method: requestProps.method,
    _body,
    _bodyString,
    _headers,
    _headerObject: headerObject,
    _headerArray: headerArray,
  });

  checkType<Ctx & CtxRequestProps>(telefuncContext);
}

function isHeaders(headers: unknown): headers is HeaderArray | HeaderObject {
  if (!isObject(headers)) {
    return false;
  }
  if (Array.isArray(headers)) {
    if (
      headers.every(
        (h: unknown): h is { key: string; value: string } =>
          hasProp(h, "key", "string") && hasProp(h, "value", "string")
      )
    ) {
      checkType<{ key: string; value: string }[]>(headers);
      checkType<HeaderArray>(headers);
      return true;
    }
  } else {
    if (isStringMap(headers)) {
      checkType<Record<string, string>>(headers);
      checkType<HeaderObject>(headers);
      return true;
    }
  }
  return false;
}

function isStringMap(obj: unknown): obj is Record<string, string> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    Object.values(obj).every((h: unknown): h is string => typeof h === "string")
  );
}

function parseHeaders(headers: null | HeaderObject | HeaderArray): {
  headerArray: null | HeaderArray;
  headerObject: null | HeaderObject;
} {
  let headerArray: null | HeaderArray;
  let headerObject: null | HeaderObject;
  if (headers === null) {
    headerArray = null;
    headerObject = null;
  } else if (Array.isArray(headers)) {
    headerArray = headers;
    headerObject = Object.fromEntries(
      headers.map(({ key, value }) => [key, value])
    );
  } else {
    headerArray = Object.entries(headers).map(([key, value]) => ({
      key,
      value,
    }));
    headerObject = headers;
  }
  return { headerArray, headerObject };
}

function addCtxEnv<Ctx extends Record<string, unknown>>(
  telefuncContext: Ctx,
  telefunctEnv: CtxEnv
): asserts telefuncContext is Ctx & CtxEnv {
  objectAssign(telefuncContext, telefunctEnv);
  checkType<Ctx & CtxEnv>(telefuncContext);
}

function validateArgs(...args: unknown[]): CtxEnv {
  const [argObj, ...argsRest2] = args;
  assertUsage(
    argsRest2.length === 0,
    "`createTelefuncCaller()`: all arguments should be passed as a single argument object."
  );
  assertUsage(
    isPlainObject(argObj),
    '`createTelefuncCaller(argumentObject)`: all arguments should be passed as a single argument object, i.e. `typeof argumentObject === "object"`.'
  );
  assertUsage(
    hasProp(argObj, "isProduction", "boolean"),
    "`createTelefuncCaller({ isProduction })`: argument `isProduction` should be a boolean."
  );
  const _isProduction = argObj.isProduction;
  let _viteDevServer: undefined | ViteDevServer = undefined;
  let _root: undefined | string;
  if (_isProduction) {
    _viteDevServer = undefined;
    _root = undefined;
    if ("root" in argObj && argObj.root !== undefined) {
      assertUsage(
        hasProp(argObj, "root", "string"),
        "`createTelefuncCaller({ root })`: argument `root` should be a string."
      );
      _root = argObj.root;
    }
    return { _viteDevServer, _root, _isProduction };
  } else {
    assertUsage(
      hasProp(argObj, "viteDevServer"),
      "`createTelefuncCaller({ viteDevServer })`: argument `viteDevServer` is missing."
    );
    assertUsage(
      hasProp(argObj, "root", "string"),
      "`createTelefuncCaller({ root })`: argument `root` should be a string."
    );
    _viteDevServer = argObj.viteDevServer as ViteDevServer;
    _root = argObj.root;
    return { _viteDevServer, _root, _isProduction };
  }
}
