// import db from "./nexis.save" with { type: "sqlite" };
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppStateProvider } from "./app-state/useAppState";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

// console.log(db.query("SELECT * FROM TABLE NAME;").get());

const elem = document.getElementById("root");

if (!elem) {
  throw new Error("Unable to find the #root element for app mounting.");
}

const app = (
  <StrictMode>
    <AppErrorBoundary>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </AppErrorBoundary>
  </StrictMode>
);

createRoot(elem).render(app);
