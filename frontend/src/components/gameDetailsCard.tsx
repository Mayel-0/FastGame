import type Game from "../models/game";

interface CardProps {
  game: Game | undefined ,
}

function GameDetailsCard({game}:CardProps) {
  if (game === undefined) return <section><p>Erreur de chatrgement du jeux</p></section>
  return(
    <section>
      <div className="game-card__media">
        {game.image ? (
          <img src={game.image} alt={`Pochette de ${game.titre}`} loading="lazy" />
        ) : (
          <div className="game-card__placeholder" aria-hidden="true">FG</div>
        )}
        <span className="game-card__genre">{game.genre || "Jeu"}</span>
      </div>
      <h2>{game?.titre}</h2>
      <div>
        <h3>{game?.studio}</h3>
        <p>{game?.plateforme}</p>
        <p>{game?.annee}</p>
      </div>
    </section>
  );
}

export default GameDetailsCard;
