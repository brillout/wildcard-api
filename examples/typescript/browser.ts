import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { LandingPage } from "./landing-page/LandingPage";

ReactDOM.render(
  React.createElement(LandingPage),
  document.getElementById("react-root")
);
