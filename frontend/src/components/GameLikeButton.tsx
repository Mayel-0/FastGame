import { Heart } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface GameLikeButtonProps {
  gameId: number;
  liked: boolean;
  onToggle: (gameId: number) => Promise<void>;
}

function GameLikeButton({ gameId, liked, onToggle }: GameLikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthenticated) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onToggle(gameId);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="game-like" onSubmit={handleSubmit}>
      <button
        className={`game-like__button ${liked ? "game-like__button--active" : ""}`}
        type="submit"
        disabled={isLoading}
        aria-label={liked ? "Retirer le like" : "Ajouter un like"}
      >
        <Heart size={18} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        <span>{liked ? "Liké" : "Liker"}</span>
      </button>
    </form>
  );
}

export default GameLikeButton;
