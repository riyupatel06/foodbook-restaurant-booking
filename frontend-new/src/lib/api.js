const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    const networkError = new Error(
      `Unable to reach the backend at ${API_BASE_URL}. Check that the server is running and CORS allows ${window.location.origin}.`,
    );
    networkError.cause = error;
    throw networkError;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function getToken() {
  try {
    return window.localStorage.getItem("foodbook-auth-token") ?? "";
  } catch {
    return "";
  }
}

export function apiGet(path, token = getToken()) {
  return request(path, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function apiPost(path, body, token = getToken()) {
  return request(path, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
}

export function apiPatch(path, body, token = getToken()) {
  return request(path, {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(body),
  });
}

export function apiDelete(path, token = getToken()) {
  return request(path, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
