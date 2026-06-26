/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "../lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "foodbook-auth-user";
const TOKEN_KEY = "foodbook-auth-token";

function readStoredUser() {
  try {
    const storedUser = window.localStorage.getItem(STORAGE_KEY);
    const storedToken = window.localStorage.getItem(TOKEN_KEY) ?? "";
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;

    if (!parsedUser) return storedToken ? { token: storedToken } : null;
    if (parsedUser.token) return parsedUser;
    return storedToken ? { ...parsedUser, token: storedToken } : parsedUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.token) {
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    }

    window.localStorage.setItem(TOKEN_KEY, user.token);
  }, [user]);

  const loginUser = async (payload) => {
    const response = await apiPost("/auth/login", payload, "");
    setUser({ ...response.user, token: response.token });
    return response;
  };

  const registerUser = async (payload) => {
    const response = await apiPost("/auth/register", payload, "");
    setUser({ ...response.user, token: response.token });
    return response;
  };

  const refreshProfile = useCallback(async () => {
    const profile = await apiGet("/auth/me", user?.token ?? "");
    setUser((current) => (current ? { ...current, ...profile } : current));
    return profile;
  }, [user?.token]);

  const updateProfile = useCallback(async (payload) => {
    const response = await apiPatch("/auth/me", payload, user?.token ?? "");
    setUser((current) => (current ? { ...current, ...response.user, token: response.token ?? current.token } : current));
    return response;
  }, [user?.token]);

  const changePassword = useCallback(async (payload) => apiPost("/auth/change-password", payload, user?.token ?? ""), [user?.token]);

  const requestPasswordOtp = async (email) => apiPost("/auth/forgot-password/request-otp", { email }, "");

  const resetPasswordWithOtp = async (payload) => apiPost("/auth/forgot-password/reset", payload, "");

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: loginUser,
      register: registerUser,
      refreshProfile,
      updateProfile,
      changePassword,
      requestPasswordOtp,
      resetPasswordWithOtp,
      logout: () => setUser(null),
    }),
    [changePassword, refreshProfile, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
