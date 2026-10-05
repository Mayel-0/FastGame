import type { TopUser } from "../models/community";
import UserIdentity from "./UserIdentity";

interface CommunityTopUsersProps {
  users: TopUser[] | null;
  loading: boolean;
  error: string | null;
}

export default function CommunityTopUsers({ users, loading, error }: CommunityTopUsersProps) {
  return (
    <section className="community-top-users" aria-labelledby="community-top-users-title">
      <header className="community-top-users__header">
        <p className="community-top-users__eyebrow">Créateurs appréciés</p>
        <h2 className="community-top-users__title" id="community-top-users-title">
          Les membres les plus populaires
        </h2>
        <p className="community-top-users__intro">
          Classés selon les likes reçus sur leurs listes publiques.
        </p>
      </header>

      {error ? (
        <p className="community-top-users__message" role="alert">
          Le classement des membres n’a pas pu être chargé.
        </p>
      ) : loading ? (
        <p className="community-top-users__message" aria-live="polite">
          Chargement du classement…
        </p>
      ) : !users?.length ? (
        <p className="community-top-users__message">
          Aucun classement disponible pour le moment.
        </p>
      ) : (
        <ol className="community-top-users__list">
          {users.map((user, index) => (
            <li className="community-top-users__item" key={user.id}>
              <span className="community-top-users__rank" aria-label={`Rang ${index + 1}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <UserIdentity
                userId={user.id}
                username={user.username}
                imageUrl={user.image_url}
              />
              <div className="community-top-users__stats">
                <strong>{user.likes_received}</strong>
                <span>{user.likes_received === 1 ? "like reçu" : "likes reçus"}</span>
                <span className="community-top-users__lists">
                  {user.public_lists_count} {user.public_lists_count === 1 ? "liste" : "listes"}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
