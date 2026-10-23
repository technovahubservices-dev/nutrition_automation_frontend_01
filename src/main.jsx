import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./typography.css";
import App from "./App.jsx";

const getRouterBasename = () => {
  const basePath = new URL(
    import.meta.env.BASE_URL,
    window.location.origin
  ).pathname.replace(/\/+$/, "");

  if (
    !basePath ||
    (
      window.location.pathname !== basePath &&
      !window.location.pathname.startsWith(`${basePath}/`)
    )
  ) {
    return undefined;
  }

  return basePath;
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={getRouterBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

