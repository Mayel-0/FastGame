import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type Game from "../models/game";
import type LikeWithGame from "../models/likeWithGame";

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
      .then((data: LikeWithGame[]) =>
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
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { games, loading, error };
};

export default useLikesByUser;
