import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const el = document.getElementById("root");
if (!el) {
  document.body.innerHTML = "Root element not found.";
} else {
  // Visible fallback to detect early crashes in dev
  el.textContent = "Loading...";
  try {
    createRoot(el).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err: any) {
    el.textContent = `App failed to mount: ${err?.message || String(err)}`;
  }
}
