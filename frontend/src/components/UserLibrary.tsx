import { useState } from "react";
import { Link } from "react-router-dom";
import { STATUTS, STATUT_LABELS, type LibraryGame, type Statut } from "../models/statut";
import { toSlug } from "../utils/slug";

interface UserLibraryProps {
  games: LibraryGame[];
}

function UserLibrary({ games }: UserLibraryProps) {
  const [selected, setSelected] = useState<Statut | "tous">("tous");

  const countByStatut = (statut: Statut) => games.filter((game) => game.statut === statut).length;
  const visibleGames = selected === "tous" ? games : games.filter((game) => game.statut === selected);

  return (
    <section className="profile-page__games user-library" aria-labelledby="user-library-title">
      <header className="profile-page__section-header">
        <p className="profile-page__eyebrow">Sa progression</p>
        <h2 className="profile-page__section-title" id="user-library-title">Bibliothèque</h2>
      </header>

      {games.length === 0 ? (
        <p className="profile-page__empty">Aucun jeu dans la bibliothèque pour le moment.</p>
      ) : (
        <>
          <div className="user-library__filters" role="group" aria-label="Filtrer par statut">
            <button
              type="button"
              className={`user-library__filter ${selected === "tous" ? "user-library__filter--active" : ""}`}
              aria-pressed={selected === "tous"}
              onClick={() => setSelected("tous")}
            >
              Tous <span>{games.length}</span>
            </button>
            {STATUTS.map((statut) => (
              <button
                key={statut}
                type="button"
                className={`user-library__filter ${selected === statut ? "user-library__filter--active" : ""}`}
                aria-pressed={selected === statut}
                onClick={() => setSelected(statut)}
              >
                {STATUT_LABELS[statut]} <span>{countByStatut(statut)}</span>
              </button>
            ))}
          </div>

          {visibleGames.length === 0 ? (
            <p className="profile-page__empty">Aucun jeu avec ce statut.</p>
          ) : (
            <ul className="user-library__list">
              {visibleGames.map((game) => (
                <li key={game.id}>
                  <Link className="user-library__game" to={`/jeux/d/${toSlug(game.titre ?? "")}`}>
                    {game.image ? (
                      <img className="user-library__image" src={game.image} alt="" loading="lazy" />
                    ) : (
                      <span className="user-library__image user-library__image--empty" aria-hidden="true">FG</span>
                    )}
                    <span className="user-library__copy">
                      <span className="user-library__title">{game.titre || "Jeu sans titre"}</span>
                      <span className={`user-library__badge user-library__badge--${game.statut}`}>
                        {STATUT_LABELS[game.statut]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default UserLibrary;
