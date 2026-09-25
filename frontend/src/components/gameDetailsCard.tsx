import type Game from "../models/game";

interface CardProps {
  game: Game;
  noteAverage: number | null;
  notesCount: number;
}

function GameDetailsCard({ game, noteAverage, notesCount }: CardProps) {
  return (
    <article className="game-card game-card--details">
      <div className="game-card__media">
        {game.image ? (
          <img src={game.image} alt={`Pochette de ${game.titre}`} loading="lazy" />
        ) : (
          <div className="game-card__placeholder" aria-hidden="true">FG</div>
        )}
        <span className="game-card__genre">{game.genre || "Jeu"}</span>
      </div>

      <div className="game-card__body">
        <p className="game-card__year">{game.annee || "Année inconnue"}</p>
        <h2>{game.titre || "Jeu sans titre"}</h2>

        <div className="game-card__rating">
          <span>{noteAverage !== null ? noteAverage.toFixed(1) : "—"}</span>
          <small>{notesCount} note{notesCount > 1 ? "s" : ""}</small>
        </div>

        <dl className="game-card__details">
          <div><dt>Studio</dt><dd>{game.studio || "Non renseigné"}</dd></div>
          <div><dt>Plateforme</dt><dd>{game.plateforme || "Non renseignée"}</dd></div>
          <div><dt>Genre</dt><dd>{game.genre || "Non renseigné"}</dd></div>
          <div><dt>Sortie</dt><dd>{game.annee || "Année inconnue"}</dd></div>
        </dl>

        {game.url ? (
          <a className="game-card__link" href={game.url} target="_blank" rel="noreferrer">
            Voir le site officiel
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default GameDetailsCard;
