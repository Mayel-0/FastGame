import type { PublicList } from "../models/community";
import { Heart, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserIdentity from "./UserIdentity";

interface CommunityPublicListsProps {
  lists: PublicList[] | null;
  loading?: boolean;
  error?: string | null;
  query?: string;
  onQueryChange?: (query: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  likeStates?: Record<number, PublicListLikeState>;
  onToggleLike?: (listId: number, initialLiked?: boolean, initialCount?: number) => Promise<boolean>;
  eyebrow?: string;
  title?: string;
}

interface PublicListLikeState {
  liked: boolean;
  likesCount: number;
  loading: boolean;
  error: string | null;
}

function PublicListCard({
  list,
  likeState,
  onToggleLike,
}: {
  list: PublicList;
  likeState?: PublicListLikeState;
  onToggleLike?: CommunityPublicListsProps["onToggleLike"];
}) {
  const { user, isAuthenticated } = useAuth();
  const isMine = !!user && user.id === list.owner_id;
  const liked = likeState?.liked ?? list.liked_by_me ?? false;
  const likesCount = likeState?.likesCount ?? list.likes_count ?? 0;

  return (
    <article className="community-list" key={list.list_id}>
      <div className="community-list__preview" aria-hidden="true">
        {list.preview.slice(0, 4).map((image, index) => (
          <img key={`${list.list_id}-${index}`} src={image} alt="" loading="lazy" />
        ))}
      </div>
      <div className="community-list__body">
        <div className="community-list__owner">
          <UserIdentity
            userId={list.owner_id ?? 0}
            username={list.owner}
            imageUrl={list.owner_image_url ?? null}
          />
        </div>
        <h3 className="community-list__title">{list.title}</h3>
        <div className="community-list__meta">
          <p className="community-list__count">{list.items_count} jeux</p>
          {onToggleLike && !isMine ? (
            <button
              type="button"
              className="community-list__like-button"
              onClick={() => onToggleLike(list.list_id, liked, likesCount)}
              disabled={likeState?.loading || !isAuthenticated}
              aria-label={liked ? "Retirer le like" : "Liker cette liste"}
              aria-pressed={liked}
              title={isAuthenticated ? undefined : "Connecte-toi pour liker une liste"}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
              <span>{likesCount}</span>
            </button>
          ) : (
            <span className="community-list__like-count" aria-label={`${likesCount} likes`}>
              <Heart size={16} aria-hidden="true" />
              <span>{likesCount}</span>
            </span>
          )}
        </div>
        {likeState?.error && <small className="community-list__error">{likeState.error}</small>}
      </div>
    </article>
  );
}

export default function CommunityPublicLists({
  lists,
  loading = false,
  error = null,
  query = "",
  onQueryChange,
  hasMore = false,
  onLoadMore,
  likeStates,
  onToggleLike,
  eyebrow = "À découvrir",
  title = "Listes de la communauté",
}: CommunityPublicListsProps) {
  return (
    <section className="community-lists" aria-labelledby="community-lists-title">
      <header className="community-lists__header">
        <div>
          <p className="community-lists__eyebrow">{eyebrow}</p>
          <h2 className="community-lists__title" id="community-lists-title">{title}</h2>
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
            <PublicListCard
              key={list.list_id}
              list={list}
              likeState={likeStates?.[list.list_id]}
              onToggleLike={onToggleLike}
            />
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
