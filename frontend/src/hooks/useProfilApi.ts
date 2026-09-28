import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type Game from "../models/game";
import type LikeWithGame from "../models/likes";

const useLikesByUser = () => {
  const { authFetch } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authFetch(`${import.meta.env.VITE_API_URL}/api/likes/me`)
      .then((res) => {
        if (!res.ok) throw Error("Erreur récupération des likes");
        return res.json();
      })
      .then((data: LikeWithGame[]) => {
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
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { games, loading, error };
};

export default useLikesByUser;
