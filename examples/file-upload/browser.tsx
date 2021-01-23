import "babel-polyfill";
import { server } from "telefunc/client";
import { Hello } from "./hello.telefunc";
import ReactDOM = require("react-dom");
import React = require("react");

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
  function handleChangeFile(event: HTMLInputEvent) {
    const { files } = event.target;
    const file = files[0];
    let formData = new FormData();
    formData.append("file", file);
    submitForm("some-string", file);
    console.log(files.length);
    console.log(file);
    console.log(file.constructor);
    // @ts-ignore
    window.file = file;
  }
}

function submitForm(s: string, file: File) {
  console.log(s);
  console.log(file);
}

function decorator(
  fn: (str: string, f: File) => void
): (str: string, f: File) => void {
  return fn;
}

async function renderApp() {
  const msg = await hello("Johny");
  console.log(msg);
  ReactDOM.render(<Form />, document.getElementById("react-root"));
}
