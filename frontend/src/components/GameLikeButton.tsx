import { Heart } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface GameLikeButtonProps {
  gameId: number;
}

function GameLikeButton({ gameId }: GameLikeButtonProps) {
  const { isAuthenticated, authFetch } = useAuth();
  const [liked, setLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLiked(false);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    setIsReady(false);
    authFetch(`${API_URL}/api/likes/${gameId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Impossible de vérifier le like.");
        return response.json() as Promise<{ liked: boolean }>;
      })
      .then((status) => {
        if (!cancelled) setLiked(status.liked);
      })
      .catch(() => {
        if (!cancelled) setLiked(false);
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authFetch, gameId, isAuthenticated]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated || !isReady || isLoading) return;

    setIsLoading(true);
    try {
      const response = liked
        ? await authFetch(`${API_URL}/api/likes/${gameId}`, { method: "DELETE" })
        : await authFetch(`${API_URL}/api/likes/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game_id: gameId }),
          });

      if (response.ok) setLiked((current) => !current);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <form className="game-like" onSubmit={handleSubmit}>
      <button
        className={`game-like__button ${liked ? "game-like__button--active" : ""}`}
        type="submit"
        disabled={!isReady || isLoading}
        aria-label={liked ? "Retirer le like" : "Ajouter un like"}
        title={liked ? "Retirer le like" : "Ajouter un like"}
      >
        <Heart size={18} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{liked ? "Liké" : "Liker"}</span>
      </button>
    </form>
  );
}

export default GameLikeButton;
