import GameList from "../components/gameList";
import useAllGame from "../hooks/useAllGame";
import PageLoader from "../components/pageLoader";
import { useAuth } from "../context/AuthContext";

function GamesPage() {
  const { AllGames: games, loading: loadingGames, error } = useAllGame();
  const { isLoading: loadingUser} = useAuth();

  const isLoading = [loadingGames, loadingUser].some(Boolean)

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
          <GameList games={games} />
        )}
      </PageLoader>
    </div>
  );
}

export default GamesPage;
