import type { PublicList } from "../models/community";
import UserIdentity from "./UserIdentity";

interface CommunityPublicListsProps {
  lists: PublicList[] | null;
}

export default function CommunityPublicLists({ lists }: CommunityPublicListsProps) {
  return (
    <section className="community-lists" aria-labelledby="community-lists-title">
      <header className="community-lists__header">
        <p className="community-lists__eyebrow">À découvrir</p>
        <h2 className="community-lists__title" id="community-lists-title">Listes de la communauté</h2>
      </header>
      {!lists?.length ? (
        <p className="community-lists__empty">Aucune liste publique à afficher pour le moment.</p>
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
    </section>
  );
}