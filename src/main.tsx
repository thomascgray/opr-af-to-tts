import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Maintenance } from "./Maintenance";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* <App /> */}
    <Maintenance />
  </React.StrictMode>
);
