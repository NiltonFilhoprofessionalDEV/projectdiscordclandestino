import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { App } from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster
      theme="dark"
      position="top-center"
      toastOptions={{
        className: "glass !border-white/10 !bg-panel/90 !text-fog",
      }}
    />
  </StrictMode>,
);
