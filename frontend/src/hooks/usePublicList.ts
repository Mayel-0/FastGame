import { useEffect, useState } from "react";
import type { PublicListDetail } from "../models/community";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const usePublicList = (listId: number | null) => {
  const [list, setList] = useState<PublicListDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(listId !== null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (listId === null) {
      setList(null);
      setError(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);
    setList(null);

    fetch(`${API_URL}/api/lists/public/${listId}`, { signal: controller.signal })
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw Error("Erreur récupération de la liste");
        return res.json() as Promise<PublicListDetail>;
      })
      .then((data) => {
        if (data) setList(data);
      })
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") setError(requestError?.message ?? String(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [listId]);

  return { list, loading, error, notFound };
};

export default usePublicList;