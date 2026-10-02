import { useCallback, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { LikeResponse } from "../models/likes";

// Même valeur par défaut que dans AuthContext
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function useToggleListLike() {
  const { authFetch, isAuthenticated } = useAuth();
  const [likeStates, setLikeStates] = useState<
    Record<
      number,
      {
        liked: boolean;
        likesCount: number;
        loading: boolean;
        error: string | null;
      }
    >
  >({});
  const busyRef = useRef(new Set<number>());

  const toggle = useCallback(
    async (
      listId: number,
      initialLiked = false,
      initialCount = 0,
    ): Promise<boolean> => {
      if (busyRef.current.has(listId)) return false;

      if (!isAuthenticated) {
        setLikeStates((previous) => ({
          ...previous,
          [listId]: {
            ...(previous[listId] ?? {
              liked: initialLiked,
              likesCount: initialCount,
              loading: false,
            }),
            error: "Connecte-toi pour liker une liste.",
          },
        }));
        return false;
      }

      busyRef.current.add(listId);
      const current = likeStates[listId] ?? {
        liked: initialLiked,
        likesCount: initialCount,
        loading: false,
        error: null,
      };
      const previousLiked = current.liked;
      const previousCount = current.likesCount;
      const nextLiked = !previousLiked;

      setLikeStates((previous) => ({
        ...previous,
        [listId]: {
          liked: nextLiked,
          likesCount: Math.max(0, previousCount + (nextLiked ? 1 : -1)),
          loading: true,
          error: null,
        },
      }));

      try {
        const res = await authFetch(`${API_URL}/api/lists/${listId}/like`, {
          method: nextLiked ? "POST" : "DELETE",
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            typeof body?.detail === "string"
              ? body.detail
              : `Erreur ${res.status}`,
          );
        }

        const data = (await res.json()) as LikeResponse;
        setLikeStates((previous) => ({
          ...previous,
          [listId]: {
            liked: data.liked,
            likesCount: data.likes_count,
            loading: false,
            error: null,
          },
        }));
        return true;
      } catch (e) {
        setLikeStates((previous) => ({
          ...previous,
          [listId]: {
            liked: previousLiked,
            likesCount: previousCount,
            loading: false,
            error: e instanceof Error ? e.message : "Erreur inconnue",
          },
        }));
        return false;
      } finally {
        busyRef.current.delete(listId);
      }
    },
    [authFetch, isAuthenticated, likeStates],
  );

  return { likeStates, toggle };
}
