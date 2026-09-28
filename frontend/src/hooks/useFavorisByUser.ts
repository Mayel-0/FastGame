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
      .then((data: FavoriWithGame[]) => {
        const mappedGames: Game[] = data.map((item) => ({
          id: item.game_id,
          titre: item.titre ?? null,
          studio: item.studio ?? null,
          plateforme: item.plateforme ?? null,
          annee: item.annee ? String(item.annee) : null,
          genre: item.genre ?? null,
          image: item.image ?? null,
          url: item.url ?? null,
        }));

        return mappedGames;
      })
      .then(setGames)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  return { games, loading, error };
};

export default useFavorisByUser;
