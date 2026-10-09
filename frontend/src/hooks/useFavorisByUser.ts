import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type Game from "../models/game";
import type { FavoriWithGame } from "../models/favoris";
import { API_URL } from "../utils/api";

const useFavorisByUser = () => {
  const { authFetch } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(`${API_URL}/api/favoris/me/games`)
      .then((res) => {
        if (!res.ok)
          throw new Error("Erreur lors de la récupération des favoris");
        return res.json() as Promise<FavoriWithGame[]>;
      })
      .then((data) =>
        setGames(
          data.map((item) => ({
            id: item.game_id,
            titre: item.titre,
            studio: item.studio,
            plateforme: item.plateforme,
            annee: item.annee,
            genre: item.genre,
            image: item.image,
            url: item.url,
          })),
        ),
      )
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  return { games, loading, error };
};

export default useFavorisByUser;
