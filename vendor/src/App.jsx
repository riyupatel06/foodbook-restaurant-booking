import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import VendorLogin from "./pages/VendorLogin";
import VendorRegister from "./pages/VendorRegister";
import VendorPanel from "./pages/VendorPanel";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VendorPanel />} />
        <Route path="/login" element={<VendorLogin />} />
        <Route path="/register" element={<VendorRegister />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
