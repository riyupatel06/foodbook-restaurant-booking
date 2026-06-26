/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

const VendorAuthContext = createContext(null);
const STORAGE_KEY = "foodbook-vendor-user";
const TOKEN_KEY = "foodbook-vendor-token";

function readStoredVendor() {
  try {
    const storedVendor = window.localStorage.getItem(STORAGE_KEY);
    const storedToken = window.localStorage.getItem(TOKEN_KEY) ?? "";
    const parsedVendor = storedVendor ? JSON.parse(storedVendor) : null;

    if (!parsedVendor) return storedToken ? { token: storedToken } : null;
    if (parsedVendor.token) return parsedVendor;
    return storedToken ? { ...parsedVendor, token: storedToken } : parsedVendor;
  } catch {
    return null;
  }
}

export function VendorAuthProvider({ children }) {
  const [vendor, setVendor] = useState(() => readStoredVendor());

  useEffect(() => {
    if (vendor) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vendor));
      window.localStorage.setItem(TOKEN_KEY, vendor.token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }, [vendor]);

  const loginVendor = async (payload) => {
    const response = await apiPost("/vendor/login", payload, "");
    setVendor({ ...response.vendor, token: response.token });
    return response;
  };

  const googleLoginVendor = async (credential) => {
    const response = await apiPost("/vendor/google", { credential }, "");
    setVendor({ ...response.vendor, token: response.token });
    return response;
  };

  const registerVendor = async (payload) => {
    const response = await apiPost("/vendor/register", payload, "");
    setVendor({ ...response.vendor, token: response.token });
    return response;
  };

  const updateVendor = (updates) => {
    setVendor((current) => {
      if (!current) return current;
      return { ...current, ...updates, token: current.token };
    });
  };

  const refreshVendor = useCallback(async () => {
    const token = vendor?.token ?? getVendorToken();
    if (!token) return null;

    const response = await apiGet("/vendor/me", token);
    setVendor((current) => ({ ...response, token: current?.token ?? token }));
    return response;
  }, [vendor?.token]);

  useEffect(() => {
    if (!vendor?.token) return;

    const timer = window.setTimeout(() => {
      refreshVendor().catch(() => setVendor(null));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshVendor, vendor?.token]);

  const value = useMemo(
    () => ({
      vendor,
      token: vendor?.token ?? "",
      isVendorAuthenticated: Boolean(vendor),
      loginVendor,
      registerVendor,
      loginWithGoogle: googleLoginVendor,
      updateVendor,
      refreshVendor,
      logoutVendor: () => setVendor(null),
    }),
    [refreshVendor, vendor],
  );

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>;
}

export function useVendorAuth() {
  const context = useContext(VendorAuthContext);
  if (!context) throw new Error("useVendorAuth must be used within VendorAuthProvider");
  return context;
}

export function getVendorToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}
