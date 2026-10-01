import type { PublicList } from "../models/community";
import { Search } from "lucide-react";
import UserIdentity from "./UserIdentity";

interface CommunityPublicListsProps {
  lists: PublicList[] | null;
  loading?: boolean;
  error?: string | null;
  query?: string;
  onQueryChange?: (query: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function CommunityPublicLists({
  lists,
  loading = false,
  error = null,
  query = "",
  onQueryChange,
  hasMore = false,
  onLoadMore,
}: CommunityPublicListsProps) {
  return (
    <section className="community-lists" aria-labelledby="community-lists-title">
      <header className="community-lists__header">
        <div>
          <p className="community-lists__eyebrow">À découvrir</p>
          <h2 className="community-lists__title" id="community-lists-title">Listes de la communauté</h2>
        </div>
        {onQueryChange && (
          <label className="community-lists__search">
            <Search className="community-lists__search-icon" size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Titre ou pseudo"
              aria-label="Rechercher une liste par titre ou pseudo"
            />
          </label>
        )}
      </header>
      {onQueryChange && (
        <p className="community-lists__status" aria-live="polite">
          {loading ? "Recherche des listes…" : `${lists?.length ?? 0} liste${lists?.length === 1 ? "" : "s"}`}
        </p>
      )}
      {error ? (
        <p className="community-lists__message" role="alert">Les listes publiques n’ont pas pu être chargées.</p>
      ) : !lists?.length ? (
        <p className="community-lists__message">
          {loading
            ? "Chargement des listes publiques…"
            : query.trim().length === 1
              ? "Saisissez au moins 2 caractères pour rechercher."
              : query.trim().length >= 2
                ? "Aucune liste ne correspond à cette recherche."
                : "Aucune liste publique à afficher pour le moment."}
        </p>
      ) : (
        <div className="community-lists__grid">
          {lists.map((list) => (
            <article className="community-list" key={list.list_id}>
              <div className="community-list__preview" aria-hidden="true">
                {list.preview.slice(0, 4).map((image, index) => (
                  <img key={`${list.list_id}-${index}`} src={image} alt="" loading="lazy" />
                ))}
              </div>
              <div className="community-list__body">
                <div className="community-list__owner">
                  <UserIdentity
                    userId={list.owner_id}
                    username={list.owner}
                    imageUrl={list.owner_image_url}
                  />
                </div>
                <h3 className="community-list__title">{list.title}</h3>
                <p className="community-list__count">{list.items_count} jeux</p>
              </div>
            </article>
          ))}
        </div>
      )}
      {hasMore && onLoadMore && (
        <button
          className="community-lists__load-more"
          type="button"
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? "Chargement…" : "Charger plus de listes"}
        </button>
      )}
    </section>
  );
}
