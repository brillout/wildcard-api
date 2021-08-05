import { parse } from "@brillout/json-s";
import type { ViteDevServer } from "vite";
import { BodyParsed, Telefunction, Telefunctions } from "../shared/types";
import {
  assert,
  assertUsage,
  checkType,
  hasProp,
  isCallable,
  isObject,
  objectAssign,
} from "./utils";
import { telefuncServer } from "./global-instance";
import type { HttpResponseProps } from "./TelefuncServer";
import { loadTelefuncFilesWithVite } from "../vite/loadTelefuncFilesWithVite";
import { TelefuncContextEnv, TelefuncContextUserProvided } from "./types";

export { setTelefuncFiles };
export { callTelefunc };

type TelefuncContextRequestProps = {
  _url: string;
  _method: string;
  _body: string | Record<string, unknown>;
  _bodyParsed: BodyParsed;
  _telefunctionName: string;
  _telefunctionArgs: unknown[];
};

async function callTelefunc(
  args: unknown[],
  telefuncEnv: TelefuncContextEnv
): Promise<null | { body: string; statusCode: number }> {
  const { requestPropsParsed, telefuncContext } = parseArgs(args);
  checkType<TelefuncContextUserProvided>(telefuncContext);

  if (
    requestPropsParsed.method !== "POST" &&
    requestPropsParsed.method !== "post"
  )
    return null;

  const requestBodyParsed = parseBody(requestPropsParsed);
  objectAssign(telefuncContext, {
    _url: requestPropsParsed.url,
    _method: requestPropsParsed.method,
    _body: requestBodyParsed.body,
    _bodyParsed: requestBodyParsed.bodyParsed,
    _telefunctionName: requestBodyParsed.bodyParsed.name,
    _telefunctionArgs: requestBodyParsed.bodyParsed.args,
  });
  checkType<TelefuncContextRequestProps>(telefuncContext);

  addCtxEnv(telefuncContext, telefuncEnv);
  checkType<TelefuncContextEnv>(telefuncContext);

  const telefunctions = await getTelefunctions(telefuncContext);
  Object.entries(telefunctions).forEach(([telefunctionName, telefunction]) => {
    telefuncServer.telefunctions[telefunctionName] = telefunction;
  });

  const httpResponse: null | HttpResponseProps =
    //await telefuncServer.getApiHttpResponse(telefuncContext, telefuncContext);
    await telefuncServer.getApiHttpResponse(telefuncContext);
  // console.log("tt", telefuncContext);
  return httpResponse;
}

function parseBody({ url, body }: { url: string; body: unknown }) {
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
  const bodyString = typeof body === "string" ? body : JSON.stringify(body);

  let bodyParsed: unknown;
  try {
    bodyParsed = parse(bodyString);
  } catch (err_) {}
  assertUsage(
    hasProp(bodyParsed, "name", "string") &&
      hasProp(bodyParsed, "args", "array"),
    "`callTelefunc({ body })`: The `body` you provided to `callTelefunc()` should be the body of the HTTP request `" +
      url +
      "`. This is not the case; make sure you are properly retrieving the HTTP request body and pass it to `callTelefunc({ body })`. " +
      "(Parsed `body`: `" +
      JSON.stringify(bodyParsed) +
      "`.)"
  );

  return { body, bodyParsed };
}

function parseArgs(args: unknown[]) {
  const [requestProps, telefuncContext, ...argsRest] = args;
  assertUsage(
    argsRest.length === 0,
    "You are providing more than 2 arguments to `callTelefunc(arg1, arg2)` but `callTelefunc()` accepts only two arguments"
  );
  assertUsage(
    requestProps,
    "`callTelefunc(requestProps, telefuncContext)`: argument `requestProps` is missing."
  );
  assertUsage(
    isObject(requestProps),
    "`callTelefunc(requestProps, telefuncContext)`: argument `requestProps` should be an object."
  );
  assertUsage(
    telefuncContext,
    "`callTelefunc(requestProps, telefuncContext)`: argument `telefuncContext` is missing."
  );
  assertUsage(
    isObject(telefuncContext),
    "`callTelefunc(requestProps, telefuncContext)`: argument `telefuncContext` should be an object."
  );
  assertUsage(
    hasProp(requestProps, "url"),
    "`callTelefunc({ url })`: argument `url` is missing."
  );
  assertUsage(
    hasProp(requestProps, "url", "string"),
    "`callTelefunc({ url })`: argument `url` should be a string."
  );
  assertUsage(
    hasProp(requestProps, "method"),
    "`callTelefunc({ method })`: argument `method` is missing."
  );
  assertUsage(
    hasProp(requestProps, "method", "string"),
    "`callTelefunc({ method })`: argument `method` should be a string."
  );
  assertUsage(
    "body" in requestProps,
    "`callTelefunc({ body })`: argument `body` is missing."
  );

  const requestPropsParsed = {
    url: requestProps.url,
    method: requestProps.method,
    body: requestProps.body,
  };

  return {
    requestPropsParsed,
    telefuncContext,
  };
}

function addCtxEnv<Ctx extends Record<string, unknown>>(
  telefuncContext: Ctx,
  telefunctEnv: TelefuncContextEnv
): asserts telefuncContext is Ctx & TelefuncContextEnv {
  objectAssign(telefuncContext, telefunctEnv);
  checkType<Ctx & TelefuncContextEnv>(telefuncContext);
}

var telefuncFiles: undefined | TelefuncFiles;

function setTelefuncFiles(_telefuncFiles: TelefuncFiles) {
  telefuncFiles = _telefuncFiles;
}

async function getTelefunctions(telefuncContext: {
  _viteDevServer?: ViteDevServer;
  _root?: string;
  _isProduction: boolean;
}): Promise<Record<string, Telefunction>> {
  if (telefuncFiles === undefined) {
    const telefuncFiles = await loadTelefuncFiles(telefuncContext);
    setTelefuncFiles(telefuncFiles);
  }
  assert(telefuncFiles);
  const telefunctions: Telefunctions = {};
  Object.entries(telefuncFiles).forEach(
    ([telefuncFileName, telefuncFileExports]) => {
      Object.entries(telefuncFileExports).forEach(
        ([exportName, telefunction]) => {
          const telefunctionName = telefuncFileName + ":" + exportName;
          assertTelefunction(telefunction, {
            exportName,
            telefuncFileName,
          });
          telefunctions[telefunctionName] = telefunction;
        }
      );
    }
  );
  return telefunctions;
}

function assertTelefunction(
  telefunction: unknown,
  {
    exportName,
    telefuncFileName,
  }: {
    exportName: string;
    telefuncFileName: string;
  }
): asserts telefunction is Telefunction {
  assertUsage(
    isCallable(telefunction),
    `The telefunction \`${exportName}\` defined in \`${telefuncFileName}\` is not a function. A tele-function should always be a function.`
  );
}

type TelefuncFiles = Record<string, Record<string, unknown>>;

async function loadTelefuncFiles(telefuncContext: {
  _viteDevServer?: ViteDevServer;
  _root?: string;
  _isProduction: boolean;
}): Promise<TelefuncFiles> {
  let telefuncFiles: TelefuncFiles;
  if (!hasProp(telefuncContext, "_root", "string")) {
    // TODO assert that something like `setTelefunctions`/`setTelefuncFiles` has been called
    assert(false);
  }
  if (hasProp(telefuncContext, "_viteDevServer")) {
    telefuncFiles = await loadTelefuncFilesWithVite(telefuncContext);
  } else {
    assert(false); // TODO
  }
  return telefuncFiles;
}
