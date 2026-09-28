import { useParams, Navigate } from "react-router-dom";
import PageLoader from "../components/pageLoader";
import GameList from "../components/gameList";
import { useAuth } from "../context/AuthContext";
import useLikesByUser from "../hooks/useProfilApi";
import useLikeStatus from "../hooks/useLikeStatus";
import type Game from "../models/game";
import useFavorisByUser from "../hooks/useFavorisByUser";
import useUserLists from "../hooks/useUserLists";

function DynamiqueListePage() {
  const { title } = useParams<{ title: string }>();

  const { games: GameLikes, loading: loadingGames } = useLikesByUser();
  const { isLoading: loadingUser } = useAuth();
  const { games: GameFavoris, loading: loadingFavoris } = useFavorisByUser();
  const { joinedLists, loading: loadingLists } = useUserLists();

  const isLoadingData = [
    loadingGames,
    loadingUser,
    loadingFavoris,
    loadingLists,
  ].some(Boolean);

  // useLikeStatus toujours appelé, mais avec [] pendant le loading
  // (le hook gère déjà gameIds.length === 0 proprement)
  const getGamesByTitle = (): Game[] | "INVALID_ROUTE" => {
    if (title === "likes") return GameLikes;
    if (title === "favoris") return GameFavoris;
    const matchedList = joinedLists.find((l) => l.title === title);
    if (matchedList) return matchedList.games;
    return "INVALID_ROUTE";
  };

  const gamesOrInvalid = isLoadingData ? [] : getGamesByTitle();
  const games = Array.isArray(gamesOrInvalid) ? gamesOrInvalid : [];
  const gameIds = games.map((g) => g.id);

  const { likes, toggleLike } = useLikeStatus(gameIds);

  // Guards conditionnels après tous les hooks
  if (isLoadingData) {
    return (
      <main className="list-page">
        <PageLoader loading={true}>
          <div className="list-page__header">
            <h2 className="list-page__title">{title}</h2>
          </div>
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
          <h2 className="list-page__title">{title}</h2>
        </div>
        <hr className="list-page__divider" />
        <GameList onToggleLike={toggleLike} likes={likes} games={games} />
      </PageLoader>
    </main>
  );
}

export default DynamiqueListePage;
