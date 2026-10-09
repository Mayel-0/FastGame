import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../utils/api";

const useLikeStatus = () => {
  const { isAuthenticated, authFetch } = useAuth();
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLikes({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    authFetch(`${API_URL}/api/likes/me`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        return res.json() as Promise<{ game_id: number }[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setLikes(Object.fromEntries(data.map((like) => [like.game_id, true])));
      })
      .catch(() => {
        if (!cancelled) setLikes({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authFetch]);

  const toggleLike = useCallback(
    async (gameId: number) => {
      const isLiked = likes[gameId] ?? false;
      const response = isLiked
        ? await authFetch(`${API_URL}/api/likes/${gameId}`, { method: "DELETE" })
        : await authFetch(`${API_URL}/api/likes/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game_id: gameId }),
          });

      if (response.ok) {
        setLikes((prev) => ({ ...prev, [gameId]: !isLiked }));
      }
    },
    [likes, authFetch],
  );

  return { likes, loading, toggleLike };
};

export default useLikeStatus;
