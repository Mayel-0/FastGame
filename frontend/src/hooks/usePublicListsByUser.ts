import { useState, useEffect } from "react";
import type { PublicList } from "../models/community";

interface propsUseLikeByuser {
  users_id: number | null;
}

const usePublicListsByUser = ({ users_id }: propsUseLikeByuser) => {
  const [ListUser, setListUser] = useState<PublicList[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/api/lists/user/${users_id}`,
    )
      .then((res) => {
        if (!res.ok) throw Error("Erreur recuperation des jeux");
        return res.json();
      })
      .then(setListUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { ListUser, loading, error };
};

export default usePublicListsByUser;
