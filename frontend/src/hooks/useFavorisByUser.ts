import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type Game from "../models/game";
import type { FavoriWithGame } from "../models/favoris";

const useFavorisByUser = () => {
  const { authFetch } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(`${import.meta.env.VITE_API_URL}/api/favoris/me/games`)
      .then((res) => {
        if (!res.ok)
          throw new Error("Erreur lors de la récupération des favoris");
        return res.json();
      })
      .then((data: FavoriWithGame[]) =>
        data.map(
          ({
            game_id,
            titre,
            studio,
            plateforme,
            annee,
            genre,
            image,
            url,
          }) => ({
            id: game_id,
            titre,
            studio,
            plateforme,
            annee,
            genre,
            image,
            url,
          }),
        ),
      )
      .then(setGames)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  return { games, loading, error };
};

export default useFavorisByUser;
