/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiPost } from "./lib/api";
import { updateAdminProfile } from "./services/adminApi";

const AdminAuthContext = createContext(null);
const STORAGE_KEY = "foodbook-admin-user";
const TOKEN_KEY = "foodbook-admin-token";

function readStoredAdmin() {
  try {
    const storedAdmin = window.localStorage.getItem(STORAGE_KEY);
    const storedToken = window.localStorage.getItem(TOKEN_KEY) ?? "";
    const parsedAdmin = storedAdmin ? JSON.parse(storedAdmin) : null;

    if (!parsedAdmin) return storedToken ? { token: storedToken } : null;
    if (parsedAdmin.token) return parsedAdmin;
    return storedToken ? { ...parsedAdmin, token: storedToken } : parsedAdmin;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => readStoredAdmin());

  useEffect(() => {
    if (admin) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [admin]);

  useEffect(() => {
    if (admin?.token) window.localStorage.setItem(TOKEN_KEY, admin.token);
    else window.localStorage.removeItem(TOKEN_KEY);
  }, [admin]);

  const login = async (payload) => {
    const response = await apiPost("/admin/login", payload, "");
    setAdmin({ ...response.admin, token: response.token });
    return response;
  };

  const updateProfile = async (payload) => {
    const response = await updateAdminProfile(payload, admin?.token ?? "");
    setAdmin((current) => ({ ...current, ...response, token: current?.token ?? "" }));
    return response;
  };

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      token: admin?.token ?? "",
      login,
      updateProfile,
      logout: () => setAdmin(null),
    }),
    [admin],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
