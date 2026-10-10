import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import type { Notification } from "../models/notification";
import { formatRelativeDate } from "../utils/date";
import { resolveMediaUrl } from "../utils/media";
import { toSlug } from "../utils/slug";

function getNotificationLink(notification: Notification): string {
  if (notification.type === "like_liste" && notification.liste) {
    return `/listes/public/${notification.liste.id}`;
  }
  if (notification.type === "like_note" && notification.game) {
    return `/jeux/d/${toSlug(notification.game.titre ?? "")}`;
  }
  return `/profil/${notification.actor.id}`;
}

function getNotificationText(notification: Notification): string {
  if (notification.type === "like_liste") {
    return `a aimé votre liste « ${notification.liste?.title ?? "supprimée"} »`;
  }
  if (notification.type === "like_note") {
    return `a aimé votre avis sur ${notification.game?.titre ?? "un jeu"}`;
  }
  return "s'est abonné à vous";
}

function NotificationBell() {
  const { notifications, unreadCount, error, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) void markAllAsRead();
    setIsOpen((open) => !open);
  };

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        className="notification-bell__button"
        type="button"
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : "Notifications"}
        aria-expanded={isOpen}
        aria-controls="notification-panel"
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-bell__count" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell__panel" id="notification-panel">
          <p className="notification-bell__label">Notifications</p>
          {error ? (
            <p className="notification-bell__empty" role="alert">Les notifications n'ont pas pu être chargées.</p>
          ) : notifications.length === 0 ? (
            <p className="notification-bell__empty">Aucune notification pour le moment.</p>
          ) : (
            <ul className="notification-bell__list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    className={`notification-bell__item ${notification.lue ? "" : "notification-bell__item--unread"}`}
                    to={getNotificationLink(notification)}
                    onClick={() => setIsOpen(false)}
                  >
                    <img
                      className="notification-bell__avatar"
                      src={resolveMediaUrl(notification.actor.image_url)}
                      alt=""
                    />
                    <span className="notification-bell__copy">
                      <span>
                        <strong>{notification.actor.username}</strong> {getNotificationText(notification)}
                      </span>
                      <time className="notification-bell__date" dateTime={notification.created_at}>
                        {formatRelativeDate(notification.created_at)}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
