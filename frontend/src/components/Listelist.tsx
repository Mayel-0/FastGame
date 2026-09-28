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
          <button type="button">
            <LockOpen className="Listes__icon" size={20} aria-hidden="true" />
            <span>Public</span>
          </button>
        </article>
      </Link>

      <Link to="/listes/favoris">
        <article className="Listes__card">
          <Star className="Listes__icon" size={20} aria-hidden="true" />
          <h3>Favoris</h3>
          <button type="button">
            <Lock className="Listes__icon" size={20} aria-hidden="true" />
            <span>Privé</span>
          </button>
        </article>
      </Link>

      {listes.map((items) => (
        <Link key={items.id} to={`/listes/${items.liste_title}`}>
          <article className="Listes__card">
            <Folder className="Listes__icon" size={20} aria-hidden="true" />
            <h3>{items.liste_title}</h3>

            <button type="button" onClick={() => handleTogglePublic(items)}>
              {items.public ? (
                <>
                  <LockOpen className="Listes__icon" size={20} aria-hidden="true" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="Listes__icon" size={20} aria-hidden="true" />
                  <span>Privé</span>
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
