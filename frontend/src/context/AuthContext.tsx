import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type Profil from "../models/profil";

const TOKEN_STORAGE_KEY = "fastgame_access_token";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface JwtPayload {
  sub?: string | number;
  id?: string | number;
  exp?: number;
}

interface AuthContextValue {
  token: string | null;
  user: Profil | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<Profil>;
  logout: () => void;
  refreshProfile: () => Promise<Profil | null>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as JwtPayload;
  } catch {
    return null;
  }
}

function hasSubject(token: string): boolean {
  const payload = decodeToken(token);
  return payload?.sub !== undefined && payload.sub !== null;
}

function isTokenExpired(token: string): boolean {
  const expiration = decodeToken(token)?.exp;
  return expiration !== undefined && expiration * 1000 <= Date.now();
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<Profil | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    if (!token) return fetch(input, init);

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(input, { ...init, headers });

    if (response.status === 401) logout();
    return response;
  }, [logout, token]);

  const refreshProfile = useCallback(async (): Promise<Profil | null> => {
    if (!token || isTokenExpired(token)) {
      logout();
      return null;
    }

    if (!hasSubject(token)) {
      logout();
      return null;
    }

    const response = await authFetch(`${API_URL}/api/users/me`);
    if (!response.ok) {
      if (response.status !== 401) logout();
      return null;
    }

    const profile = (await response.json()) as Profil;
    setUser(profile);
    return profile;
  }, [authFetch, logout, token]);

  const login = useCallback(async (newToken: string): Promise<Profil> => {
    if (!newToken || isTokenExpired(newToken) || !hasSubject(newToken)) {
      throw new Error("Token d'authentification invalide ou expire");
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);

    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    if (!response.ok) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      throw new Error("Impossible de recuperer le profil");
    }

    const profile = (await response.json()) as Profil;
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  useEffect(() => {
    if (!token) return;

    const expiration = decodeToken(token)?.exp;
    if (expiration === undefined) return;

    const timeout = window.setTimeout(logout, Math.max(0, expiration * 1000 - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [logout, token]);

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: user !== null, isLoading, login, logout, refreshProfile, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit etre utilise dans un AuthProvider");
  return context;
}
