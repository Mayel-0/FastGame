import { Heart, Star, UserRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user } = useAuth();
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
            <h2>{user?.username}</h2>
          </div>
          <button className="profile-drawer__close" type="button" onClick={onClose} aria-label="Fermer le menu du profil">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="profile-drawer__navigation" aria-label="Options du profil">
          <Link className="profile-drawer__link" to="/profil" onClick={onClose}>
            <UserRound size={20} aria-hidden="true" />
            <span>Mon profil</span>
          </Link>
          <Link className="profile-drawer__link" to="/likes" onClick={onClose}>
            <Heart size={20} aria-hidden="true" />
            <span>Mes likes</span>
          </Link>
          <Link className="profile-drawer__link" to="/favoris" onClick={onClose}>
            <Star size={20} aria-hidden="true" />
            <span>Mes favoris</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}

export default ProfileDrawer;
