import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { LikedList } from "../models/community";

// Même valeur par défaut que dans AuthContext
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function useMyLikedLists(limit = 50) {
  const { authFetch, isAuthenticated, isLoading: authLoading } = useAuth();
  const [lists, setLists] = useState<LikedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // On attend que le contexte d'authentification ait fini de charger
    if (authLoading) return;

    if (!isAuthenticated) {
      setLists([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    authFetch(`${API_URL}/api/lists/me/liked?limit=${limit}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json() as Promise<LikedList[]>;
      })
      .then(setLists)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [authFetch, isAuthenticated, authLoading, limit, tick]);

  /** Relance la requête. */
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  /** Retire une liste de l'affichage tout de suite (après avoir retiré son like). */
  const removeList = useCallback(
    (listId: number) =>
      setLists((prev) => prev.filter((l) => l.list_id !== listId)),
    [],
  );

  return { lists, loading, error, refetch, removeList };
}
