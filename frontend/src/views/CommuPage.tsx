import { useTopRatedGames } from "../hooks/useTopRatedGames";
import { useWorstRatedGames } from "../hooks/useWorstRatedGames";
import PageLoader from "../components/pageLoader";
import { useRandomPublicLists } from "../hooks/useRandomPublicLists";
import { useMostLikedGames } from "../hooks/useMostLikedGames";

function CommuPage() {
  const { data: TopGame, loading: loadingTopGame } = useTopRatedGames(5);
  const {data: WorstGame, loading: loadingWorstGame } = useWorstRatedGames(5);
  const {data: ListeRandom, loading: loadingRandomList }= useRandomPublicLists();
  const {data: MostLikeGame, loading: loadingMostLikeGame } = useMostLikedGames();

  const isLoading = [loadingTopGame,loadingWorstGame,loadingRandomList, loadingMostLikeGame].some(Boolean)

  return (
    <main>
      <PageLoader loading={isLoading}>
        <h1>Communauté</h1>
        <h3>Top</h3>
        <ul>
          {TopGame?.map((game) => (
            <li key={game.id}>
              {game.titre} : ★ {game.avg_rating} ({game.ratings_count} notes)
            </li>
          ))}
        </ul>
        <h3>Worst</h3>
        <ul>
          {WorstGame?.map((game) => (
            <li key={game.id}>
              {game.titre} : ★ {game.avg_rating} ({game.ratings_count} notes)
            </li>
          ))}
        </ul>
        <h3>Most Liked</h3>
        <ul>
          {MostLikeGame?.map((game) => (
            <li key={game.id}>
              {game.titre} : ★ {game.avg_rating} ({game.ratings_count} notes)
            </li>
          ))}
        </ul>
        <h3>Liste random</h3>
        <ul>
          {ListeRandom?.map((liste) => (
            <li key={liste.list_id}>
              {liste.owner} : {liste.title} / {liste.items_count}
            </li>
          ))}
        </ul>
      </PageLoader>
    </main>
  );
}

export default CommuPage;
