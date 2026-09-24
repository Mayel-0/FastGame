import GameList from "../components/gameList";
import useAllGame from "../hooks/useAllGame";

function HomePage() {
  const { AllGames: games, loading, error } = useAllGame();

  return (
    <main className="home-page">
      <section className="home-page__intro">
        <p className="home-page__eyebrow">La bibliothèque FastGame</p>
        <h2>Des mondes à découvrir.</h2>
        <p>Explore une sélection de jeux, de leurs studios et des plateformes qui les font vivre.</p>
      </section>
      {loading && <p className="game-list__state">Chargement des jeux...</p>}
      {error && <p className="game-list__state game-list__state--error" role="alert">{error}</p>}
      {!loading && !error && games.length === 0 && <p className="game-list__state">Aucun jeu disponible.</p>}
      {!loading && !error && games.length > 0 && <GameList games={games} />}
    </main>
  );
}

export default HomePage;
