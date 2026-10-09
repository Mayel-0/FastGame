import { useParams } from "react-router-dom";
import UserDetails from "../components/userDetails";
import { useAuth } from "../context/AuthContext";
import useUserById from "../hooks/useUserById";
import PageLoader from "../components/pageLoader";
import useLikeByUser from "../hooks/useLikeByUser";
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
  const { data: userLikes, loading: loadingLikes } = useLikeByUser(targetId);
  const { data: userLists, loading: loadingLists } = usePublicListsByUser(targetId);
  const { likes, toggleLike } = useLikeStatus();

  const games = (userLikes ?? []).map((like) => ({
    id: like.game_id,
    titre: like.titre,
    studio: like.studio,
    plateforme: like.plateforme,
    annee: like.annee,
    genre: like.genre,
    image: like.image,
    url: like.url,
  }));

  const isLoading = loadingUser || loadingLikes || loadingLists || (!routeUserId && loadingCurrentUser);

  return (
    <PageLoader loading={isLoading}>
      {!isLoading && (!isValidUserId || !user) ? (
        <main className="profile-details">
          <p role="alert">{error ?? "Profil introuvable."}</p>
        </main>
      ) : !isLoading && user ? (
        <main className="profile-page">
          <UserDetails profil={user} currentUser={currentUser} />
          <section className="profile-page__games" aria-labelledby="profile-games-title">
            <header className="profile-page__section-header">
              <p className="profile-page__eyebrow">Sa collection</p>
              <h2 className="profile-page__section-title" id="profile-games-title">Jeux aimés</h2>
            </header>
            {games.length > 0 ? (
              <GameList onToggleLike={toggleLike} likes={likes} games={games} />
            ) : (
              <p className="profile-page__empty">Aucun jeu aimé à afficher pour le moment.</p>
            )}
          </section>
          <CommunityPublicLists lists={userLists} />
        </main>
      ) : null}
    </PageLoader>
  );
}

export default ProfilPage;
