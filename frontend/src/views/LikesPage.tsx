import PageLoader from "../components/pageLoader";
import GameList from "../components/gameList";
import { useAuth } from "../context/AuthContext";
import useLikesByUser from "../hooks/useProfilApi";

function LikesPages() {
  const { likes: likes, loading: loadingGames, error } = useLikesByUser();
  const { isLoading: loadingUser} = useAuth();

  const isLoading = [loadingGames, loadingUser].some(Boolean)
  return(
  <main>
    <PageLoader loading={isLoading} >
      <GameList games={likes}/>
    </PageLoader>
  </main>
  )
}

export default LikesPages;
