import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Statut, StatutJeu } from "../models/statut";
import { API_URL } from "../utils/api";

export const useStatuts = () => {
  const { authFetch, isAuthenticated } = useAuth();
  const [statuts, setStatuts] = useState<Record<number, Statut>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatuts({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    authFetch(`${API_URL}/api/statuts/me`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des statuts.");
        return res.json() as Promise<StatutJeu[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setStatuts(Object.fromEntries(data.map((item) => [item.game_id, item.statut])));
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authFetch, isAuthenticated]);

  const setStatut = useCallback(
    async (gameId: number, statut: Statut | null) => {
      setError(null);
      try {
        const res = await authFetch(`${API_URL}/api/statuts/${gameId}`, statut
          ? {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ statut }),
            }
          : { method: "DELETE" });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.detail || "Erreur lors de la mise à jour du statut.");
        }

        setStatuts((prev) => {
          const updated = { ...prev };
          if (statut) updated[gameId] = statut;
          else delete updated[gameId];
          return updated;
        });
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [authFetch],
  );

  return { statuts, loading, error, setStatut };
};

export default useStatuts;
