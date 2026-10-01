import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <Link className="footer__logo" to="/">FastGame</Link>
          <p className="footer__tagline">Trouve ton prochain monde a explorer.</p>
        </div>
        <nav className="footer__navigation" aria-label="Navigation secondaire">
        </nav>
      </div>
      <div className="footer__bottom">
        <p className="footer__copyright">© {new Date().getFullYear()} FastGame</p>
        <p className="footer__note">Une bibliotheque pensee pour les joueurs.</p>
      </div>
    </footer>
  );
}

export default Footer;
