import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { App } from "./App.tsx";
import { registerServiceWorker } from "./pwa/registerServiceWorker.ts";
import "./index.css";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster
      theme="dark"
      position="top-center"
      toastOptions={{
        className: "!rounded-xl !border-white/[0.08] !bg-panel !text-cloud !shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
      }}
    />
  </StrictMode>,
);
