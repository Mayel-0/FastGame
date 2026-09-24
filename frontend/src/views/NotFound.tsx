import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router-dom";

function Notfound() {
  return (
    <main className="not-found" aria-labelledby="not-found-title">
      <div className="not-found__content">
        <span className="not-found__icon" aria-hidden="true">
          <Compass size={28} strokeWidth={1.6} />
        </span>
        <p className="eyebrow">Erreur 404</p>
        <h1 id="not-found-title">Cette page a pris un autre chemin.</h1>
        <p className="not-found__message">
          L’adresse demandée n’existe pas ou n’est plus disponible. Revenez à
          l’accueil pour poursuivre votre visite.
        </p>
        <Link className="btn btn--accent" to="/">
          <ArrowLeft size={17} aria-hidden="true" />
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}

export default Notfound;
