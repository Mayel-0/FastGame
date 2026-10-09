import { useParams, Navigate } from "react-router-dom";
import PageLoader from "../components/pageLoader";
import GameList from "../components/gameList";
import UserIdentity from "../components/UserIdentity";
import { useAuth } from "../context/AuthContext";
import useLikesByUser from "../hooks/useProfilApi";
import useLikeStatus from "../hooks/useLikeStatus";
import type Game from "../models/game";
import useFavorisByUser from "../hooks/useFavorisByUser";
import useUserLists from "../hooks/useUserLists";
import usePublicList from "../hooks/usePublicList";

function DynamiqueListePage() {
  const { title, listId } = useParams<{ title: string; listId: string }>();

  const { games: GameLikes, loading: loadingGames } = useLikesByUser();
  const { isLoading: loadingUser } = useAuth();
  const { games: GameFavoris, loading: loadingFavoris } = useFavorisByUser();
  const { joinedLists, loading: loadingLists } = useUserLists();

  const hasPublicParam = listId !== undefined;
  const parsedListId = Number(listId);
  const isValidPublicId = Number.isInteger(parsedListId) && parsedListId > 0;
  const {
    list: publicList,
    loading: loadingPublic,
    error: publicError,
    notFound: publicNotFound,
  } = usePublicList(hasPublicParam && isValidPublicId ? parsedListId : null);

  const isLoadingData = [
    loadingGames,
    loadingUser,
    loadingFavoris,
    loadingLists,
    loadingPublic,
  ].some(Boolean);

  const getGamesByTitle = (): Game[] | "INVALID_ROUTE" => {
    if (title === "likes") return GameLikes;
    if (title === "favoris") return GameFavoris;
    const matchedList = joinedLists.find((l) => l.title === title);
    if (matchedList) return matchedList.games;
    return "INVALID_ROUTE";
  };

  const getGamesForRoute = (): Game[] | "INVALID_ROUTE" => {
    if (!hasPublicParam) return getGamesByTitle();
    if (!isValidPublicId || publicNotFound || !publicList) return "INVALID_ROUTE";
    return publicList.games;
  };

  const gamesOrInvalid = isLoadingData ? [] : getGamesForRoute();
  const games = Array.isArray(gamesOrInvalid) ? gamesOrInvalid : [];

  const { likes, toggleLike } = useLikeStatus();

  if (isLoadingData) {
    return (
      <main className="list-page">
        <PageLoader loading={true}>
          <div className="list-page__header">
            <h2 className="list-page__title">{publicList?.title ?? title}</h2>
          </div>
        </PageLoader>
      </main>
    );
  }

  if (publicError) {
    return (
      <main className="list-page">
        <PageLoader loading={false}>
          <div className="list-page__header">
            <h2 className="list-page__title">Liste indisponible</h2>
          </div>
          <p className="game-list__state game-list__state--error" role="alert">
            {publicError}
          </p>
        </PageLoader>
      </main>
    );
  }

  if (gamesOrInvalid === "INVALID_ROUTE") {
    return <Navigate to="/*" replace />;
  }

  return (
    <main className="list-page">
      <PageLoader loading={false}>
        <div className="list-page__header">
          <h2 className="list-page__title">{publicList?.title ?? title}</h2>
          {publicList && (
            <div className="list-page__meta">
              <UserIdentity
                userId={publicList.owner_id}
                username={publicList.owner}
                imageUrl={publicList.owner_image_url ?? null}
              />
              <span className="list-page__count">{publicList.items_count} jeux</span>
            </div>
          )}
        </div>
        <hr className="list-page__divider" />
        <GameList onToggleLike={toggleLike} likes={likes} games={games} />
      </PageLoader>
    </main>
  );
}

export default DynamiqueListePage;
