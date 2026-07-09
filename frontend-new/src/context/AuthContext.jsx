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
  const [isAuthReady, setIsAuthReady] = useState(() => !readStoredUser()?.token);

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
    const token = user?.token ?? "";
    if (!token) {
      setIsAuthReady(true);
      return null;
    }

    const profile = await apiGet("/auth/me", token);
    setUser((current) => (current ? { ...current, ...profile } : current));
    setIsAuthReady(true);
    return profile;
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) {
      setIsAuthReady(true);
      return;
    }

    setIsAuthReady(false);
    const timer = window.setTimeout(() => {
      refreshProfile().catch(() => {
        setUser(null);
        setIsAuthReady(true);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshProfile, user?.token]);

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
      isAuthReady,
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
    [changePassword, isAuthReady, refreshProfile, updateProfile, user],
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
