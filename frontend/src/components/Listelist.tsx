import { Heart, Star, Lock, LockOpen, Folder } from "lucide-react";
import type { Liste } from "../models/liste";
import type { LikedList } from "../models/community";
import { Link } from "react-router-dom";
import UserIdentity from "./UserIdentity";

interface ListLikeState {
  liked: boolean;
  likesCount: number;
  loading: boolean;
  error: string | null;
}

interface ListesListProps {
  listes: Liste[];
  updateList: (
    listId: number,
    data: { liste_title?: string; public?: boolean }
  ) => Promise<boolean>;
  likedLists?: LikedList[];
  likeStates?: Record<number, ListLikeState>;
  onToggleLikedList?: (listId: number, initialLiked?: boolean, initialCount?: number) => Promise<boolean>;
}

function ListesList({
  listes,
  updateList,
  likedLists,
  likeStates = {},
  onToggleLikedList,
}: ListesListProps) {
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
          <article className="Listes__card">
            <Folder className="Listes__icon" size={20} aria-hidden="true" />
            <Link key={items.id} to={`/listes/${items.liste_title}`}>
              <h3>{items.liste_title}</h3>
            </Link>

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
      ))}
        {likedLists && (
          <section className="Listes__liked" aria-labelledby="liked-lists-title">
            <header className="Listes__liked-header">
              <p className="Listes__liked-eyebrow">Votre sélection</p>
              <h2 className="Listes__liked-title" id="liked-lists-title">Listes que vous aimez</h2>
            </header>
            {likedLists.length === 0 ? (
              <p className="Listes__liked-empty">Vous n’avez pas encore aimé de liste publique.</p>
            ) : (
              <div className="Listes__liked-grid">
                {likedLists.map((list) => {
                  const likeState = likeStates[list.list_id];
                  const liked = likeState?.liked ?? list.liked_by_me;
                  const likesCount = likeState?.likesCount ?? list.likes_count;

                  return (
                    <article className="Listes__liked-card" key={list.list_id}>
                      <div className="Listes__liked-preview" aria-hidden="true">
                        {list.preview.slice(0, 4).map((image, index) => (
                          <img key={`${list.list_id}-${index}`} src={image} alt="" loading="lazy" />
                        ))}
                      </div>
                      <div className="Listes__liked-body">
                        <UserIdentity
                          userId={list.owner_id}
                          username={list.owner}
                          imageUrl={list.owner_image_url}
                        />
                        <h3>
                          <Link className="Listes__liked-link" to={`/listes/public/${list.list_id}`}>
                            {list.title}
                          </Link>
                        </h3>
                        <div className="Listes__liked-meta">
                          <span>{list.items_count} jeux</span>
                          <button
                            type="button"
                            className="Listes__liked-button"
                            onClick={() => onToggleLikedList?.(list.list_id, liked, likesCount)}
                            disabled={!onToggleLikedList || likeState?.loading}
                            aria-label={liked ? "Retirer le like" : "Liker cette liste"}
                            aria-pressed={liked}
                          >
                            <Heart size={16} fill={liked ? "currentColor" : "none"} aria-hidden="true" />
                            <span>{likesCount}</span>
                          </button>
                        </div>
                        {likeState?.error && <small className="Listes__liked-error">{likeState.error}</small>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
    </section>
  );
}

export default ListesList;
