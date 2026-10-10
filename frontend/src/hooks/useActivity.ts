import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Activity } from "../models/activite";
import { API_URL } from "../utils/api";

const PAGE_SIZE = 20;

export function useActivity() {
  const { authFetch, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    authFetch(`${API_URL}/api/activite/?limit=${PAGE_SIZE}&offset=${offset}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json() as Promise<Activity[]>;
      })
      .then((page) => {
        setActivities((current) => (offset === 0 ? page : [...current, ...page]));
        setHasMore(page.length === PAGE_SIZE);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [authFetch, isAuthenticated, authLoading, offset]);

  const loadMore = useCallback(() => setOffset((current) => current + PAGE_SIZE), []);

  return { activities, loading, error, hasMore, loadMore };
}
