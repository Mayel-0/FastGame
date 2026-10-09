import GameList from "../components/gameList";
import useAllGame from "../hooks/useAllGame";
import PageLoader from "../components/pageLoader";
import { useAuth } from "../context/AuthContext";
import useLikeStatus from "../hooks/useLikeStatus";
import useUserLists from "../hooks/useUserLists"
import useFavoris from "../hooks/useFavoris";

function GamesPage() {
  const { games, loading: loadingGames, error } = useAllGame();
  const { joinedLists, addItemToList, loading: listsLoading } = useUserLists();
  const { favorisMap, toggleFavori } = useFavoris();

  const availableLists = joinedLists.map((l) => ({
    id: l.list_id,
    liste_title: l.title,
  }));

  const { isLoading: loadingUser} = useAuth();
  const { likes, loading: loadingLikes, toggleLike } = useLikeStatus();

  const isLoading = [loadingGames, loadingUser, loadingLikes, listsLoading].some(Boolean)

  return (
    <div className="games-page">
      <PageLoader loading={isLoading}>
        <section className="games-page__header" aria-labelledby="games-title">
          <div>
            <p className="games-page__eyebrow">Catalogue FastGame</p>
            <h1 id="games-title">Tous les jeux</h1>
            <p>Explore les titres, studios et plateformes de notre bibliothèque.</p>
          </div>
          <p className="games-page__count"><strong>{games.length}</strong> jeux</p>
        </section>
        {error ? (
          <p className="game-list__state game-list__state--error" role="alert">{error}</p>
        ) : (
          <GameList
            games={games}
            likes={likes}
            onToggleLike={toggleLike}
            lists={availableLists}
            favorisMap={favorisMap}
            onToggleFavori={toggleFavori}
            onAddToList={addItemToList}
          />
        )}
      </PageLoader>
    </div>
  );
}

export default GamesPage;
