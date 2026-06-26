import { useEffect, useState } from "react";
import { fetchAdminDashboard } from "../services/adminApi";

export function useAdminDashboard() {
  const [state, setState] = useState({ data: null, loading: true, error: "" });

  const load = async () => {
    try {
      setState((current) => ({ ...current, loading: true, error: "" }));
      const data = await fetchAdminDashboard();
      setState({ data, loading: false, error: "" });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message || "Failed to load admin dashboard" });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { ...state, reload: load };
}
