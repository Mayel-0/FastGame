import { useState } from "react";
import type Game from "../models/game";
import GameLikeButton from "./GameLikeButton";
import GameFavoriButton from "./GameFavoriButton";
import { Link } from "react-router-dom";
import { toSlug } from "../utils/slug";
import { Menu, Folder } from "lucide-react";
import type { ListOption } from "../models/liste";
import { useAuth } from "../context/AuthContext"; // 1. Importation de useAuth

interface GameListProps {
  games: Game[];
  likes: Record<number, boolean>;
  lists?: ListOption[];
  favorisListId?: number;
  favorisMap?: Record<number, boolean>;
  onToggleLike: (gameId: number) => Promise<void>;
  onToggleFavori?: (gameId: number) => Promise<void | boolean>;
  onAddToList?: (listId: number, gameId: number) => Promise<void | boolean>;
}

function GameList({
  games,
  likes,
  lists = [],
  favorisListId = 0,
  favorisMap = {},
  onToggleLike,
  onToggleFavori,
  onAddToList,
}: GameListProps) {
  const { isAuthenticated } = useAuth(); // 2. Récupération du statut d'authentification
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const toggleMenu = (gameId: number) => {
    setOpenMenuId((prev) => (prev === gameId ? null : gameId));
  };

  const handleSelectOption = async (listId: number, gameId: number) => {
    setOpenMenuId(null);
    if (onAddToList) {
      await onAddToList(listId, gameId);
    }
  };

  const handleToggleFavori = async (gameId: number) => {
    setOpenMenuId(null);
    if (onToggleFavori) {
      await onToggleFavori(gameId);
    } else if (onAddToList) {
      await onAddToList(favorisListId, gameId);
    }
  };

  const otherLists = favorisListId
    ? lists.filter((l) => l.id !== favorisListId)
    : lists;

  return (
    <section className="game-list" aria-label="Liste des jeux">
      {games.map((game) => (
        <article className="game-card" key={game.id}>
          <div className="game-card__media">
            {game.image ? (
              <img src={game.image} alt={`Pochette de ${game.titre}`} loading="lazy" />
            ) : (
              <div className="game-card__placeholder" aria-hidden="true">FG</div>
            )}
            <span className="game-card__genre">{game.genre || "Jeu"}</span>
          </div>

          <div className="game-card__body">
            <div className="game-card__heading">
              <p className="game-card__year">{game.annee || "Année inconnue"}</p>
              <h3>{game.titre || "Jeu sans titre"}</h3>
            </div>

            <dl className="game-card__details">
              <div><dt>Studio</dt><dd>{game.studio || "Non renseigné"}</dd></div>
              <div><dt>Plateforme</dt><dd>{game.plateforme || "Non renseignée"}</dd></div>
            </dl>

            <Link to={`/jeux/d/${toSlug(game.titre ?? "")}`} state={{ game }}>
              Voir la fiche
            </Link>

            {/* 3. Masquer le bloc d'actions s'il n'est pas connecté */}
            {isAuthenticated && (
              <div className="game-card__actions" style={{ position: "relative" }}>
                <GameLikeButton
                  gameId={game.id}
                  liked={likes[game.id] ?? false}
                  onToggle={onToggleLike}
                />

                <button
                  type="button"
                  className="game-card__menu-btn"
                  onClick={() => toggleMenu(game.id)}
                  aria-label="Ajouter à une liste"
                >
                  <Menu size={20} aria-hidden="true" />
                </button>

                {/* Menu déroulant */}
                {openMenuId === game.id && (
                  <div
                    className="game-card__dropdown"
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      right: 0,
                      backgroundColor: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      zIndex: 10,
                      minWidth: "160px",
                      padding: "6px 0",
                    }}
                  >
                    <p style={{ padding: "4px 12px", fontSize: "12px", color: "#666", fontWeight: "bold", margin: 0 }}>
                      Ajouter à...
                    </p>

                    <GameFavoriButton
                      gameId={game.id}
                      isFavori={favorisMap[game.id] ?? false}
                      onToggle={handleToggleFavori}
                    />

                    <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "4px 0" }} />

                    {otherLists.length > 0 ? (
                      otherLists.map((liste) => (
                        <button
                          key={liste.id}
                          type="button"
                          onClick={() => handleSelectOption(liste.id, game.id)}
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
                          }}
                        >
                          <Folder size={16} />
                          {liste.liste_title}
                        </button>
                      ))
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default GameList;
