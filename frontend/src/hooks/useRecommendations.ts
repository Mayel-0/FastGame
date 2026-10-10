import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { RecommendedGame } from "../models/game";
import { API_URL } from "../utils/api";

const useRecommendations = (limit = 8) => {
  const { authFetch, isAuthenticated } = useAuth();
  const [games, setGames] = useState<RecommendedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setGames([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    authFetch(`${API_URL}/api/jeux/recommandations?limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des recommandations.");
        return res.json() as Promise<RecommendedGame[]>;
      })
      .then((data) => {
        if (!cancelled) setGames(data);
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
  }, [authFetch, isAuthenticated, limit]);

  return { games, loading, error };
};

export default useRecommendations;
