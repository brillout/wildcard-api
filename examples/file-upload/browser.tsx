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
    submitForm("some-string", file, { anotherFile: file, param: "str" });
    console.log(files.length);
    console.log(file);
    console.log(file.constructor);
    // @ts-ignore
    window.file = file;
  }
}

const submitForm = decorator2(_submitForm);
function _submitForm(
  s: string,
  file: SuperFile,
  { anotherFile, param }: { anotherFile: SuperFile; param?: string }
) {
  console.log(s);
  console.log(param);
  console.log(file.filePath);
  console.log(anotherFile.filePath);
}

function decorator2<T>(fn: T): TransformTelefunction<T> {
  return fn as any;
}
type SuperFile = {
  filePath: string;
};

type TransformArguments<Arguments> = {
  [ArgumentIndex in keyof Arguments]: Arguments[ArgumentIndex] extends SuperFile
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
