import useAllGame from "../hooks/useAllGame";
import GameList from "../components/gameList";
import { useEffect, useState } from "react";

function HomePage() {
  const { AllGames: games, loading: loadingGames } = useAllGame();

  return (
    <main>
      <h1>FastGame</h1>
      <p>Bienvenue sur la page d'accueil.</p>
      <h2>Voici notre lite tah les fou:</h2>
      <GameList games={games}/>
    </main>
  );
}

export default HomePage;
