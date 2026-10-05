import { Heart, Star, UserRound, X, ListStart, Users, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserIdentity from "./UserIdentity";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, logout } = useAuth();
  return (
    <>
      <div
        className={`profile-drawer__overlay ${isOpen ? "profile-drawer__overlay--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="profile-drawer"
        className={`profile-drawer ${isOpen ? "profile-drawer--open" : ""}`}
        aria-label="Menu du profil"
        aria-hidden={!isOpen}
      >
        <div className="profile-drawer__header">
          <div>
            <p className="profile-drawer__eyebrow">Espace personnel</p>
            {user && <UserIdentity userId={user.id} username={user.username} imageUrl={user.image_url} />}
          </div>
          <button className="profile-drawer__close" type="button" onClick={onClose} aria-label="Fermer le menu du profil">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="profile-drawer__navigation" aria-label="Options du profil">
          <Link className="profile-drawer__link" to={user ? `/profil/${user.id}` : "/profil"} onClick={onClose}>
            <UserRound size={20} aria-hidden="true" />
            <span>Mon profil</span>
          </Link>
          <Link className="profile-drawer__link" to="/abonnements" onClick={onClose}>
            <Users size={20} aria-hidden="true" />
            <span>Mes abonnements</span>
          </Link>
          <Link className="profile-drawer__link" to="/listes/likes" onClick={onClose}>
            <Heart size={20} aria-hidden="true" />
            <span>Mes likes</span>
          </Link>
          <Link className="profile-drawer__link" to="/listes/favoris" onClick={onClose}>
            <Star size={20} aria-hidden="true" />
            <span>Mes favoris</span>
          </Link>
          <Link className="profile-drawer__link" to="/listes" onClick={onClose}>
            <ListStart size={20} aria-hidden="true" />
            <span>Mes Listes</span>
          </Link>
        </nav>
        {user && (
          <button
            className="profile-drawer__logout"
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut size={20} aria-hidden="true" />
            <span>Se déconnecter</span>
          </button>
        )}
      </aside>
    </>
  );
}

export default ProfileDrawer;
