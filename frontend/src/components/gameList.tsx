import type Game from "../models/game";

interface GameListProps {
  games: Game[];
}

function GameList({games}:GameListProps) {
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
            {game.url && (
              <a className="game-card__link" href={game.url} target="_blank" rel="noreferrer">
                Voir la fiche <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default GameList;
