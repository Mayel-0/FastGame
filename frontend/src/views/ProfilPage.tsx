import { useParams } from "react-router-dom";
import UserDetails from "../components/userDetails";
import { useAuth } from "../context/AuthContext";
import useUserById from "../hooks/useUserById";
import PageLoader from "../components/pageLoader";
import useLikeByuser from "../hooks/useLikeByUser";
import useLikeStatus from "../hooks/useLikeStatus";
import GameList from "../components/gameList";
import CommunityPublicLists from "../components/CommunityPublicLists";
import usePublicListsByUser from "../hooks/usePublicListsByUser";

function ProfilPage() {
  const { userId: routeUserId } = useParams<{ userId: string }>();

  const { user: currentUser, isLoading: loadingCurrentUser } = useAuth();
  const parsedUserId = routeUserId ? Number(routeUserId) : currentUser?.id ?? null;
  const isValidUserId = parsedUserId === null || (Number.isInteger(parsedUserId) && parsedUserId > 0);
  const targetId = isValidUserId ? parsedUserId : null;
  const { user, loading: loadingUser, error } = useUserById(targetId);
  const { LikeUser, loading: loadingLikes } = useLikeByuser({ users_id: targetId });
  const {ListUser, loading: loadingList} = usePublicListsByUser({ users_id: targetId });

  const gameIds = LikeUser.map((g) => g.id);
  const Games = LikeUser.map((g) => ({
    id: g.game_id,
    titre: g.titre,
    studio: g.studio,
    plateforme: g.plateforme,
    annee: g.annee,
    genre: g.genre,
    image: g.image,
    url: g.url,
  }));
  const { likes, toggleLike } = useLikeStatus(gameIds);


  const isLoading = loadingUser || loadingLikes || loadingList || (!routeUserId && loadingCurrentUser);

  return (
    <PageLoader loading={isLoading}>
      {!isLoading && (!isValidUserId || !user) ? (
        <main className="profile-details">
          <p role="alert">{error ?? "Profil introuvable."}</p>
        </main>
      ) : !isLoading && user ? (
        <main>
          <UserDetails profil={user} currentUser={currentUser} likes={LikeUser}/>
          <h3>Likes</h3>
          <hr/>
          <GameList onToggleLike={toggleLike} likes={likes} games={Games} />
          <CommunityPublicLists lists={ListUser}/>
        </main>
      ) : null}
    </PageLoader>
  );
}

export default ProfilPage;
