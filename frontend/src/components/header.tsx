import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileDrawer from "./ProfileDrawer";
import { Menu } from "lucide-react";
import UserIdentity from "./UserIdentity";

function Header() {
  const { isAuthenticated, user } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProfileMenuOpen(false);
    };

    document.addEventListener("keydown", closeWithEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeWithEscape);
      document.body.style.overflow = "";
    };
  }, [isProfileMenuOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `header__link${isActive ? " is-active" : ""}`;

  return (
    <header className="header">
      <h1 className="header__brand">
        <NavLink to="/">FastGame</NavLink>
      </h1>
      <nav className="header__navigation" aria-label="Navigation principale">
        <ul className="header__menu">
          <li className="header__item"><NavLink className={navLinkClass} to="/">Accueil</NavLink></li>
          <li className="header__item"><NavLink className={navLinkClass} to="/jeux">Jeux</NavLink></li>
          <li className="header__item"><NavLink className={navLinkClass} to="/commu">Communauté</NavLink></li>
        </ul>
      </nav>
      <div className="header__actions">
        {!isAuthenticated ? (
          <div className="header__action-group">
            <Link className="header__action" to="/register">s'inscrire</Link>
            <NavLink className="header__action header__action--primary" to="/login">connexion</NavLink>
          </div>
        ) : (
          <div className="header__action-group">
            {user && <UserIdentity userId={user.id} username={user.username} imageUrl={user.image_url} />}
            <button className="header__profile-menu" type="button" onClick={() => setIsProfileMenuOpen(true)} aria-label="Ouvrir le menu du profil" aria-expanded={isProfileMenuOpen} aria-controls="profile-drawer">
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {isAuthenticated && <ProfileDrawer isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} />}
    </header>
  );
}

export default Header;
