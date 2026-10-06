import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import GameList from "../components/gameList";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/pageLoader";
import useAllGame from "../hooks/useAllGame";
import useLikeStatus from "../hooks/useLikeStatus";
import useUserLists from "../hooks/useUserLists";
import useFavoris from "../hooks/useFavoris";

function HomePage() {
  const { AllGames: games, loading: loadingGames, error } = useAllGame();
  const { joinedLists, addItemToList, loading: listsLoading } = useUserLists();
  const { isLoading: loadingUser} = useAuth();
  const gameIds = games.map((g) => g.id);
  const { likes, loading: loadingLikes, toggleLike } = useLikeStatus(gameIds);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Tous");
  const { toggleFavori } = useFavoris();

  const isLoading = [loadingGames,loadingUser,loadingLikes,listsLoading].some(Boolean)

  const availableLists = joinedLists.map((l) => ({
    id: l.list_id,
    liste_title: l.title,
  }));

  const handleAddToList = async (listId: number, gameId: number) => {
    if (listId === 0) {
      await toggleFavori(gameId);
    } else {
      await addItemToList(listId, gameId);
    }
  };

  const genres = useMemo(() => {
    const values = games
      .map((game) => game.genre)
      .filter((genre): genre is string => Boolean(genre));
    return ["Tous", ...Array.from(new Set(values)).sort()];
  }, [games]);

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    return games.filter((game) => {
      const matchesSearch = !query || [game.titre, game.studio, game.genre]
        .some((value) => value?.toLowerCase().includes(query));
      const matchesGenre = selectedGenre === "Tous" || game.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [games, search, selectedGenre]);

  return (
    <PageLoader loading={isLoading}>
      <div className="home-page">
        <section className="home-page__hero" aria-labelledby="home-title">
          <div className="home-page__hero-content">
            <p className="home-page__eyebrow">La bibliothèque FastGame</p>
            <h1 id="home-title">Trouvez votre prochain jeu.</h1>
            <p className="home-page__description">
              Parcourez une sélection de jeux, découvrez leurs univers et gardez vos favoris à portée de main.
            </p>
            <a className="home-page__hero-link" href="#games">Explorer les jeux</a>
          </div>
        </section>

        <section className="home-page__catalog" id="games" aria-labelledby="catalog-title">
          <div className="home-page__catalog-heading">
            <div>
              <p className="home-page__eyebrow">Catalogue</p>
              <h2 id="catalog-title">Les jeux du moment</h2>
            </div>
            <div className="home-page__stats" aria-label="Statistiques du catalogue">
              <strong>{filteredGames.length}</strong>
              <span>{filteredGames.length > 1 ? "jeux affichés" : "jeu affiché"}</span>
            </div>
          </div>

          <div className="home-page__filters">
            <label className="home-page__search">
              <span className="u-visually-hidden">Rechercher un jeu</span>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder="Rechercher un titre, un studio..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="home-page__genre-filter">
              <span className="u-visually-hidden">Filtrer par genre</span>
              <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
                {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </select>
            </label>
          </div>

          {error && (
            <p className="game-list__state game-list__state--error" role="alert">
              {typeof error === "string" ? error : String(error)}
            </p>
          )}
          {!error && filteredGames.length === 0 && (
            <p className="game-list__state">Aucun jeu ne correspond à votre recherche.</p>
          )}
          {!error && filteredGames.length > 0
          && <GameList
            games={filteredGames}
            likes={likes}
            onToggleLike={toggleLike}
            lists={availableLists}
            favorisListId={0}
            onAddToList={handleAddToList}
          />}
        </section>
      </div>
    </PageLoader>
  );
}

export default HomePage;
