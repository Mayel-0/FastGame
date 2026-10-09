import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type Profil from "../models/profil";
import { API_URL } from "../utils/api";

const TOKEN_KEY = "fastgame_access_token";
interface JwtPayload {
  sub?: string | number;
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

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.sub) return false;
  if (payload.exp && payload.exp * 1000 <= Date.now()) return false;
  return true;
}

function getExpDelay(token: string): number | null {
  const exp = decodeToken(token)?.exp;
  if (!exp) return null;
  return Math.max(0, exp * 1000 - Date.now());
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    return stored && isTokenValid(stored) ? stored : null;
  });
  const [user, setUser] = useState<Profil | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const authFetch = useCallback(async (
    input: RequestInfo | URL,
    init: RequestInit = {}
  ): Promise<Response> => {
    const currentToken = tokenRef.current;

    if (!currentToken) {
      throw new Error("Non authentifié");
    }

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${currentToken}`);
    const response = await fetch(input, { ...init, headers });

    if (response.status === 401) logout();
    return response;
  }, [logout]);

  const fetchProfile = useCallback(async (tkn: string): Promise<Profil | null> => {
    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${tkn}` },
    });

    if (!response.ok) return null;

    const profile = (await response.json()) as Profil;
    setUser(profile);
    return profile;
  }, []);

  const refreshProfile = useCallback(async (): Promise<Profil | null> => {
    const currentToken = tokenRef.current;

    if (!currentToken || !isTokenValid(currentToken)) {
      logout();
      return null;
    }

    const profile = await fetchProfile(currentToken);
    if (!profile) {
      logout();
      return null;
    }

    return profile;
  }, [logout, fetchProfile]);

  const login = useCallback(async (newToken: string): Promise<Profil> => {
    if (!isTokenValid(newToken)) {
      throw new Error("Token invalide ou expiré");
    }

    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    tokenRef.current = newToken;

    const profile = await fetchProfile(newToken);
    if (!profile) {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      tokenRef.current = null;
      throw new Error("Impossible de récupérer le profil");
    }

    return profile;
  }, [fetchProfile]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshProfile().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;

    const delay = getExpDelay(token);
    if (delay === null) return;

    logoutTimerRef.current = setTimeout(logout, delay);
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        refreshProfile,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return context;
}
