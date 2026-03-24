import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Unable to find the #root element for app mounting.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
