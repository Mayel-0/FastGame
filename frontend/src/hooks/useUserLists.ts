import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Liste, ListItem, JoinedListe } from "../models/liste";
import { API_URL } from "../utils/api";

export const useUserLists = () => {
  const { authFetch } = useAuth();

  const [lists, setLists] = useState<Liste[]>([]);
  const [rawItems, setRawItems] = useState<ListItem[]>([]);
  const [joinedLists, setJoinedLists] = useState<JoinedListe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyLists = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/lists/me`);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des listes.");
      const data: Liste[] = await res.json();
      setLists(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  const fetchMyItems = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/lists/me/items`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des items.");
      const data: ListItem[] = await res.json();
      setRawItems(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  const fetchJoinedLists = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/lists/me/joined`);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des listes jointes.");
      const data: JoinedListe[] = await res.json();
      setJoinedLists(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  const createList = async (listeTitle: string, isPublic: boolean = true) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/lists/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liste_title: listeTitle, public: isPublic }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail || "Erreur lors de la création de la liste.",
        );
      }

      await fetchJoinedLists();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const updateList = async (
    listId: number,
    data: { liste_title?: string; public?: boolean },
  ) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail || "Erreur lors de la mise à jour de la liste.",
        );
      }

      await fetchJoinedLists();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const deleteList = async (listId: number) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/lists/${listId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail || "Erreur lors de la suppression de la liste.",
        );
      }

      setJoinedLists((prev) => prev.filter((l) => l.list_id !== listId));
      setLists((prev) => prev.filter((l) => l.id !== listId));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const addItemToList = async (listId: number, gameId: number) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/lists/me/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: listId, game_id: gameId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Erreur lors de l'ajout du jeu.");
      }

      await fetchJoinedLists();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const removeItemFromList = async (listId: number, gameId: number) => {
    setError(null);
    try {
      const res = await authFetch(
        `${API_URL}/api/lists/me/items/${listId}/${gameId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail || "Erreur lors de la suppression du jeu.",
        );
      }

      setJoinedLists((prev) =>
        prev.map((list) => {
          if (list.list_id === listId) {
            return {
              ...list,
              items_count: list.items_count - 1,
              games: list.games.filter((g) => g.id !== gameId),
            };
          }
          return list;
        }),
      );

      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchMyLists(), fetchJoinedLists()]);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  return {
    lists,
    rawItems,
    joinedLists,
    loading,
    error,
    fetchMyLists,
    fetchMyItems,
    fetchJoinedLists,
    createList,
    updateList,
    deleteList,
    addItemToList,
    removeItemFromList,
  };
};

export default useUserLists;
