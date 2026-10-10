import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Notification } from "../models/notification";
import { API_URL } from "../utils/api";

const REFRESH_DELAY = 60_000;

export function useNotifications() {
  const { authFetch, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        authFetch(`${API_URL}/api/notifications/`),
        authFetch(`${API_URL}/api/notifications/unread-count`),
      ]);
      if (!listRes.ok || !countRes.ok)
        throw new Error("Erreur lors de la récupération des notifications.");

      setNotifications((await listRes.json()) as Notification[]);
      setUnreadCount(((await countRes.json()) as { count: number }).count);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void fetchNotifications();
    const interval = window.setInterval(fetchNotifications, REFRESH_DELAY);
    return () => window.clearInterval(interval);
  }, [fetchNotifications, isAuthenticated]);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await authFetch(`${API_URL}/api/notifications/lues`, { method: "PATCH" });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour des notifications.");

      setUnreadCount(0);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [authFetch]);

  return { notifications, unreadCount, error, fetchNotifications, markAllAsRead };
}
