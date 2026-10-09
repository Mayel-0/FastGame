import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <Link className="footer__logo" to="/">FastGame</Link>
          <p className="footer__tagline">Trouve ton prochain monde à explorer.</p>
        </div>
      </div>
      <div className="footer__bottom">
        <p className="footer__copyright">© {new Date().getFullYear()} FastGame</p>
        <p className="footer__note">Une bibliothèque pensée pour les joueurs.</p>
      </div>
    </footer>
  );
}

export default Footer;
