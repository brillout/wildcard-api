import "babel-polyfill";
import { server } from "telefunc/client";
import { Hello } from "./hello.telefunc";
import ReactDOM = require("react-dom");
import React = require("react");
import assert = require("assert");

const hello = server.hello as Hello;

renderApp();

function Form() {
  return (
    <>
      <form>
        <input type="text" />
        <input type="file" onChange={handleChangeFile} multiple />
      </form>
    </>
  );
  function handleChangeFile(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    assert(files);
    const file = files[0];
    assert(file);
    let formData = new FormData();
    formData.append("file", file);
    console.log(files.length);
    console.log(file);
    console.log(file.constructor);

    submitForm("some-string", file, { anotherFile: file, param: "str" });
    submit("some-string", file, { anotherFile: file, param: "str" });
  }
}

const submitForm = decorator(_submitForm);
function _submitForm(
  s: string,
  file: FileHandler,
  { anotherFile, param }: { anotherFile: FileHandler; param?: string }
) {
  console.log(s);
  console.log(param);
  console.log(file.filePath);
  console.log(anotherFile.filePath);

  cast<number>(anotherFile);
  anotherFile.filePath;
}

async function submit(
  s: string,
  file: File,
  { anotherFile, param }: { anotherFile: File; param?: string }
) {
  console.log(s);
  console.log(param);
  const files = await handleFiles([file, anotherFile]);
  file = await handleFile(file);

  await handleFilesInline([file, anotherFile]);
  console.log(file);
  handleFilesInline_([file]);
  console.log(file.type);
  handleSingleFile(file);
  console.log(await file.filePath);

  console.log(files[0].filePath);
  console.log(files[0].filePath);
}

function decorator<T>(fn: T): TransformTelefunction<T> {
  return fn as any;
}
type FileHandler = {
  filePath: string;
};
type FileHandler2 = {
  filePath: Promise<string>;
};
async function handleFile(file: File): Promise<FileHandler & File> {
  return { ...file, filePath: "/bla" };
}
async function handleFiles(files: File[]): Promise<FileHandler[]> {
  return files.map(() => ({ filePath: "/bla" }));
}
async function handleFilesInline(files: File[]): Promise<void> {
  handleFilesInline_(files);
  assert(files);
}
function handleFilesInline_(files: File[]): asserts files is never {}
function handleSingleFile(file: File): asserts file is File & FileHandler2 {}
async function handleSingleFileWrapper(file: File): Promise<void> {
  handleSingleFile(file);
  file.filePath;
}

function cast<T>(thing: unknown): asserts thing is T {}
// Attempt with: https://www.typescriptlang.org/docs/handbook/utility-types.html#thistypetype
function castStrong<T, T2>(thing: T2): asserts thing is Extract<T, T2> & T {}
function forbid<T>(thing: unknown): asserts thing is never {}

type TransformArguments<Arguments> = {
  [ArgumentIndex in keyof Arguments]: Arguments[ArgumentIndex] extends FileHandler
    ? File
    : TransformArguments<Arguments[ArgumentIndex]>;
};
type TransformTelefunction<Telefunction> = Telefunction extends (
  ...rest: infer TelefunctionArguments
) => infer TelefunctionResult
  ? (...rest: TransformArguments<TelefunctionArguments>) => TelefunctionResult
  : never;
//*
//*/

type MinusContext<EndpointFunction, Context> = EndpointFunction extends (
  this: Context,
  ...rest: infer EndpointArguments
) => infer EndpointReturnType
  ? (...rest: EndpointArguments) => EndpointReturnType
  : never;

type FrontendType<Endpoints, Context> = {
  [EndpointName in keyof Endpoints]: MinusContext<
    Endpoints[EndpointName],
    Context
  >;
};

async function renderApp() {
  const msg = await hello("Johny");
  console.log(msg);
  ReactDOM.render(<Form />, document.getElementById("react-root"));
}
