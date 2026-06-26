import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminRestaurants from "./AdminRestaurants";
import AdminRestaurantDetail from "./AdminRestaurantDetail";
import AdminUsers from "./AdminUsers";
import AdminVendors from "./AdminVendors";
import AdminModulePage from "./AdminModulePage";
import AdminPayRestaurant from "./AdminPayRestaurant";
import { useAdminAuth } from "./AdminAuthContext";

function ProtectedAdmin({ children }) {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
}

function LoginGate() {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <Navigate to="/admin" replace /> : <AdminLogin />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<LoginGate />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <AdminLayout />
          </ProtectedAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="restaurants/:id" element={<AdminRestaurantDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="modules/:moduleSlug" element={<AdminModulePage />} />
        <Route path="pay-restaurant/restaurant/:restaurantId" element={<AdminPayRestaurant />} />
        <Route path="pay-restaurant/:paymentId" element={<AdminPayRestaurant />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
