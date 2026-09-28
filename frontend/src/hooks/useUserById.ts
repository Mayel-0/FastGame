import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type Profil from "../models/profil";

const API_URL = import.meta.env.VITE_API_URL ;

function useUserById(userId: number | null) {
  const { authFetch } = useAuth();
  const [user, setUser] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(userId !== null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId === null) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    authFetch(`${API_URL}/api/users/${userId}`)
      .then(async (response) => {
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            detail?: string;
          };
          throw new Error(data.detail ?? `Erreur ${response.status}`);
        }
        return response.json() as Promise<Profil>;
      })
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setUser(null);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Impossible de récupérer l'utilisateur.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authFetch, userId]);

  return { user, loading, error };
}

export default useUserById;
