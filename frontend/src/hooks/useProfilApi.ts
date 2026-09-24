import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type Like from "../models/likes";

const useLikesByUser = () => {
  const { user, authFetch } = useAuth();
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    authFetch(`${import.meta.env.VITE_API_URL}/api/likes/me`)
      .then((res) => {
        if (!res.ok) throw Error("Erreur récupération des likes");
        return res.json();
      })
      .then(setLikes)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [user?.id]);

  return { likes, loading, error };
};

export default useLikesByUser;
