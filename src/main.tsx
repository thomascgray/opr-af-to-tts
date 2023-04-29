import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Maintenance } from "./Maintenance";
import "./index.css";

console.log(
  "import.meta.env.VITE_IS_MAINTENANCE_MODE",
  import.meta.env.VITE_IS_MAINTENANCE_MODE
);
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {import.meta.env.VITE_IS_MAINTENANCE_MODE === "true" && <Maintenance />}
    {import.meta.env.VITE_IS_MAINTENANCE_MODE !== "true" && <App />}
  </React.StrictMode>
);
