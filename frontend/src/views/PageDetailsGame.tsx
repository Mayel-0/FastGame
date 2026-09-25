import { useParams, useLocation } from "react-router-dom";
import type Game from "../models/game";

function PageDetailsgame() {
  const { slug } = useParams();
  const { state } = useLocation();

  const game: Game | undefined = state?.game;
  //console.log(game)

  if (!game) {
    return <main><h2>Erreur dans le chargement du jeux</h2></main>;
  }

  return (
  <main>
    <div className="game-card__media">
      {game.image ? (
        <img src={game.image} alt={`Pochette de ${game.titre}`} loading="lazy" />
      ) : (
        <div className="game-card__placeholder" aria-hidden="true">FG</div>
      )}
      <span className="game-card__genre">{game.genre || "Jeu"}</span>
    </div>
    <h2>{game?.titre}</h2>
  </main>
);
}

export default PageDetailsgame;
