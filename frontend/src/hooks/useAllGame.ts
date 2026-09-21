import { useState, useEffect } from "react";
import type Game from "../models/game";

const useAllGame = () => {
  const [AllGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    console.log(`${import.meta.env.VITE_API_URL}/api/jeux/`);
    fetch(`${import.meta.env.VITE_API_URL}/api/jeux/`)
      .then((res) => {
        if (!res.ok) throw Error("Erreur recuperation des jeux");
        return res.json();
      })
      .then(setAllGames)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { AllGames, loading, error };
};

export default useAllGame;
