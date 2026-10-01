import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Abonnement, AbonnementWithUser } from "../models/abonnement";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const useAbonnements = () => {
  const { authFetch } = useAuth();

  const [following, setFollowing] = useState<Abonnement[]>([]);
  const [followers, setFollowers] = useState<Abonnement[]>([]);
  const [followingDetails, setFollowingDetails] = useState<
    AbonnementWithUser[]
  >([]);
  const [followersDetails, setFollowersDetails] = useState<
    AbonnementWithUser[]
  >([]);
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. GET /api/abonnements/me/following (Mes abonnements)
  const fetchFollowing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/abonnements/me/following`);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des abonnements.");

      const data: Abonnement[] = await res.json();
      setFollowing(data);

      const map: Record<number, boolean> = {};
      data.forEach((item) => {
        map[item.follow_id] = true;
      });
      setFollowingMap(map);

      return data;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // 2. GET /api/abonnements/me/followers (Mes abonnés)
  const fetchFollowers = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/abonnements/me/followers`);
      if (!res.ok)
        throw new Error("Erreur lors de la récupération des abonnés.");

      const data: Abonnement[] = await res.json();
      setFollowers(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  // 3. GET /api/abonnements/me/following/details (Abonnements avec profil)
  const fetchFollowingDetails = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(
        `${API_URL}/api/abonnements/me/following/details`,
      );
      if (!res.ok)
        throw new Error(
          "Erreur lors de la récupération des détails d'abonnements.",
        );

      const data: AbonnementWithUser[] = await res.json();
      setFollowingDetails(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  // 4. GET /api/abonnements/me/followers/details (Abonnés avec profil)
  const fetchFollowersDetails = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch(
        `${API_URL}/api/abonnements/me/followers/details`,
      );
      if (!res.ok)
        throw new Error(
          "Erreur lors de la récupération des détails d'abonnés.",
        );

      const data: AbonnementWithUser[] = await res.json();
      setFollowersDetails(data);
      return data;
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  // 5. POST /api/abonnements/ (S'abonner)
  const followUser = async (followId: number) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/abonnements/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ follow_id: followId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Erreur lors de l'abonnement.");
      }

      const newAbonnement: Abonnement = await res.json();

      setFollowing((prev) => [...prev, newAbonnement]);
      setFollowingMap((prev) => ({ ...prev, [followId]: true }));
      await fetchFollowingDetails();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // 6. DELETE /api/abonnements/{follow_id} (Se désabonner)
  const unfollowUser = async (followId: number) => {
    setError(null);
    try {
      const res = await authFetch(`${API_URL}/api/abonnements/${followId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Erreur lors du désabonnement.");
      }

      setFollowing((prev) =>
        prev.filter((item) => item.follow_id !== followId),
      );
      setFollowingDetails((prev) =>
        prev.filter((item) => item.user.id !== followId),
      );
      setFollowingMap((prev) => {
        const updated = { ...prev };
        delete updated[followId];
        return updated;
      });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Toggle : s'abonne ou se désabonne
  const toggleFollow = async (followId: number) => {
    if (followingMap[followId]) {
      return await unfollowUser(followId);
    } else {
      return await followUser(followId);
    }
  };

  useEffect(() => {
    fetchFollowing();
    fetchFollowers();
    fetchFollowingDetails();
    fetchFollowersDetails();
  }, [fetchFollowing]);

  return {
    following,
    followers,
    followingDetails,
    followersDetails,
    followingMap,
    loading,
    error,
    fetchFollowing,
    fetchFollowers,
    fetchFollowingDetails,
    fetchFollowersDetails,
    followUser,
    unfollowUser,
    toggleFollow,
  };
};

export default useAbonnements;
