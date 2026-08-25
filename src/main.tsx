import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { DialogProvider } from "./components/ConfirmDialog.tsx";
import { ToastProvider } from "./components/Toast.tsx";
import { LanguageProvider } from "./i18n/LanguageContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <DialogProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DialogProvider>
    </LanguageProvider>
  </StrictMode>
);
