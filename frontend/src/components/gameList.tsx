import type Game from "../models/game";
import GameLikeButton from "./GameLikeButton";
import { Link } from "react-router-dom";
import { toSlug } from "../utils/slug";


interface GameListProps {
  games: Game[];
  likes: Record<number, boolean>;
  onToggleLike: (gameId: number) => Promise<void>;
}


function GameList({games, likes, onToggleLike}:GameListProps) {
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
             <GameLikeButton
              gameId={game.id}
              liked={likes[game.id] ?? false}
              onToggle={onToggleLike}
            />
          </div>
        </article>
      ))}
    </section>
  );
}

export default GameList;
