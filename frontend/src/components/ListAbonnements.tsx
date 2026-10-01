import type { AbonnementWithUser } from "../models/abonnement";
import FollowToggleButton from "./FollowToggleButton";
import UserIdentity from "./UserIdentity";

interface propsListAbonnements {
  users: AbonnementWithUser[];
  followingMap: Record<number, boolean>;
  loading: boolean;
  onToggle: (userId: number) => Promise<boolean>;
}

function ListAbonnements({ users, followingMap, loading, onToggle }: propsListAbonnements) {
  return (
    <ul className="abonnement-list">
      {users.length === 0 ? (
        <li className="abonnement-list__empty">Aucun profil à afficher pour le moment.</li>
      ) : (
        users.map((user) => (
          <li className="abonnement-list__item" key={user.abonnement_id}>
            <UserIdentity
              userId={user.user.id}
              username={user.user.username ?? "Profil joueur"}
              imageUrl={user.user.image_url}
            />
            <FollowToggleButton
              userId={user.user.id}
              isFollowing={Boolean(followingMap[user.user.id])}
              disabled={loading}
              onToggle={onToggle}
            />
          </li>
        ))
      )}
    </ul>
  )
}

export default ListAbonnements;
