// hooks/useLikeStatus.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const useLikeStatus = (gameIds: number[]) => {
  const { isAuthenticated, authFetch } = useAuth();
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || gameIds.length === 0) {
      setLikes({});
      return;
    }

    setLoading(true);

    authFetch(`${import.meta.env.VITE_API_URL}/api/likes/me`)
      .then((res) => res.json())
      .then((data: { game_id: number }[]) => {
        const likedIds = new Set(data.map((l) => l.game_id));

        const likesMap = Object.fromEntries(
          gameIds.map((id) => [id, likedIds.has(id)]),
        );

        setLikes(likesMap);
      })
      .catch(() => setLikes({}))
      .finally(() => setLoading(false));
  }, [isAuthenticated, gameIds.length]);

  const toggleLike = useCallback(
    async (gameId: number) => {
      const isLiked = likes[gameId];
      const response = isLiked
        ? await authFetch(
            `${import.meta.env.VITE_API_URL}/api/likes/${gameId}`,
            { method: "DELETE" },
          )
        : await authFetch(`${import.meta.env.VITE_API_URL}/api/likes/`, {
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
