import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPlatform } from "./platform";

// Set theme from URL param or default to light
const url = new URL(window.location.href);
const theme = url.searchParams.get("theme") || "light";
document.documentElement.classList.add(theme);

// Initialize platform services (audio, voice, app lifecycle).
// Fire-and-forget: the app renders immediately while platform init
// completes in the background. Individual systems handle their own
// readiness states.
initPlatform().catch((err) => {
  console.warn("[Platform] Initialization failed:", err);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
