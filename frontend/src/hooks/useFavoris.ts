import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Favori } from "../models/favoris";
import { API_URL } from "../utils/api";

export const useFavoris = () => {
  const { authFetch } = useAuth();

  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [favorisMap, setFavorisMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavoris = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/favoris/me`);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des favoris.");

      const data: Favori[] = await res.json();
      setFavoris(data);

      const map: Record<number, boolean> = {};
      data.forEach((fav) => {
        map[fav.post_id] = true;
      });
      setFavorisMap(map);

      return data;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const addFavori = async (postId: number) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/favoris/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail || "Erreur lors de l'ajout aux favoris.",
        );
      }

      const newFavori: Favori = await res.json();

      setFavoris((prev) => [...prev, newFavori]);
      setFavorisMap((prev) => ({ ...prev, [postId]: true }));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const removeFavori = async (postId: number) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/favoris/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail || "Erreur lors de la suppression des favoris.",
        );
      }

      setFavoris((prev) => prev.filter((f) => f.post_id !== postId));
      setFavorisMap((prev) => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const toggleFavori = async (postId: number) => {
    if (favorisMap[postId]) {
      return await removeFavori(postId);
    } else {
      return await addFavori(postId);
    }
  };

  useEffect(() => {
    fetchFavoris();
  }, [fetchFavoris]);

  return {
    favoris,
    favorisMap,
    loading,
    error,
    fetchFavoris,
    addFavori,
    removeFavori,
    toggleFavori,
  };
};

export default useFavoris;
