import { useAuth } from "../context/AuthContext";

const BASE = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/users`;

type ApiBody = Record<string, unknown>;

interface ApiErrorResponse {
  error?: string;
  detail?: string;
}

export function useProfilApi() {
  const { authFetch, logout } = useAuth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const handleResponse = async <T>(res: Response): Promise<T | null> => {
    if (res.status === 401) {
      logout();
      window.location.href = "/login";
      return null;
    }
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as ApiErrorResponse;
      throw new Error(data.error ?? data.detail ?? `Erreur ${res.status}`);
    }
    if (res.status === 204) return null;
    return (await res.json()) as T;
  };

  const get = <T = unknown>(path: string) => {
    return authFetch(`${BASE}${path}`, {
      headers,
      credentials: "include",
    }).then((res) => handleResponse<T>(res));
  };

  const put = <T = unknown>(path: string, body: ApiBody) =>
    authFetch(`${BASE}${path}`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res));

  const post = <T = unknown>(path: string, body: ApiBody) =>
    authFetch(`${BASE}${path}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res));

  const del = <T = unknown>(path: string) =>
    authFetch(`${BASE}${path}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    }).then((res) => handleResponse<T>(res));

  return { get, put, post, del };
}

export { useProfilApi as useApi };
