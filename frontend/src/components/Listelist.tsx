import { Heart, Star, Lock, LockOpen, Folder } from "lucide-react";
import type { Liste } from "../models/liste";
import { Link } from "react-router-dom";

interface ListesListProps {
  listes: Liste[];
  updateList: (
    listId: number,
    data: { liste_title?: string; public?: boolean }
  ) => Promise<boolean>;
}

function ListesList({ listes, updateList }: ListesListProps) {
  const handleTogglePublic = async (liste: Liste) => {
    await updateList(liste.id, { public: !liste.public });
  };

  return (
    <section className="Listes">
      <Link to="/listes/likes">
        <article className="Listes__card">
          <Heart className="Listes__icon" size={20} aria-hidden="true" />
          <h3>Likes</h3>
          <button>
            <LockOpen className="Listes__icon" size={20} aria-hidden="true" />
            <label>Public</label>
          </button>
        </article>
      </Link>

      <Link to="/listes/favoris">
        <article className="Listes__card">
          <Star className="Listes__icon" size={20} aria-hidden="true" />
          <h3>Favoris</h3>
          <button>
            <Lock className="Listes__icon" size={20} aria-hidden="true" />
            <label>Privé</label>
          </button>
        </article>
      </Link>

      {listes.map((items) => (
        <Link to={`/listes/${items.liste_title}`}>
          <article className="Listes__card" key={items.id}>
            <Folder className="Listes__icon" size={20} aria-hidden="true" />
            <h3>{items.liste_title}</h3>

            {/* Bouton pour basculer le statut public/privé */}
            <button type="button" onClick={() => handleTogglePublic(items)}>
              {items.public ? (
                <>
                  <LockOpen className="Listes__icon" size={20} aria-hidden="true" />
                  <label>Public</label>
                </>
              ) : (
                <>
                  <Lock className="Listes__icon" size={20} aria-hidden="true" />
                  <label>Privé</label>
                </>
              )}
            </button>
          </article>
        </Link>
      ))}
    </section>
  );
}

export default ListesList;
