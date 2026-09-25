import { useParams, useLocation } from "react-router-dom";
import type Game from "../models/game";
import GameDetailsCard from "../components/gameDetailsCard";

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
    <GameDetailsCard game={game} />
  </main>
);
}

export default PageDetailsgame;
