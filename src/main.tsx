import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./components/contexts/AuthContext.tsx";
import { ReportProvider } from "./components/contexts/ReportDataContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ReportProvider>
       <App />
      </ReportProvider>
    </AuthProvider>
  </StrictMode>,
);
