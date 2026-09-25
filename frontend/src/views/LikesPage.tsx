import PageLoader from "../components/pageLoader";
import GameList from "../components/gameList";
import { useAuth } from "../context/AuthContext";
import useLikesByUser from "../hooks/useProfilApi";
import useLikeStatus from "../hooks/useLikeStatus";

function LikesPages() {
  const { games, loading: loadingGames } = useLikesByUser();
  const { isLoading: loadingUser} = useAuth();
  const gameIds = games.map((g) => g.id);
  const { likes, loading: loadingLikes, toggleLike } = useLikeStatus(gameIds);

  const isLoading = [loadingGames, loadingUser, loadingLikes].some(Boolean)
  return(
  <main>
    <PageLoader loading={isLoading} >
      <GameList onToggleLike={toggleLike} likes={likes} games={games}/>
    </PageLoader>
  </main>
  )
}

export default LikesPages;
