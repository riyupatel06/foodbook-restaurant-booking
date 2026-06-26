import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { VendorAuthProvider } from "./context/VendorAuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <VendorAuthProvider>
      <App />
    </VendorAuthProvider>
  </StrictMode>,
);
