import { Star } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface GameFavoriButtonProps {
  gameId: number;
  isFavori?: boolean;
  onToggle: (gameId: number) => Promise<void | boolean>;
}

function GameFavoriButton({ gameId, isFavori = false, onToggle }: GameFavoriButtonProps) {
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
    <form className="game-favori" onSubmit={handleSubmit} style={{ width: "100%" }}>
      <button
        className={`game-favori__button ${isFavori ? "game-favori__button--active" : ""}`}
        type="submit"
        disabled={isLoading}
        aria-label={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: "600",
        }}
      >
        <Star
          size={16}
          color="#eab308"
          fill={isFavori ? "#eab308" : "none"}
          aria-hidden="true"
        />
        <span>Favoris</span>
      </button>
    </form>
  );
}

export default GameFavoriButton;
