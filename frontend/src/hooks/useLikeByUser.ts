import { useState, useEffect } from "react";
import type { LikeWithGame } from "../models/likes";

interface porpsUseLikeByuser {
  users_id: number | null;
}

const useLikeByuser = ({ users_id }: porpsUseLikeByuser) => {
  const [LikeUser, setLikeUser] = useState<LikeWithGame[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/likes/user/${users_id}`,
    )
      .then((res) => {
        if (!res.ok) throw Error("Erreur recuperation des jeux");
        return res.json();
      })
      .then(setLikeUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { LikeUser, loading, error };
};

export default useLikeByuser;
