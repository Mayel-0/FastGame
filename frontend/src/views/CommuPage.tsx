import { useTopRatedGames } from "../hooks/useTopRatedGames";

function CommuPage() {
  const { data, loading, error } = useTopRatedGames(5);

  return (
    <main>
      <h1>Communauté</h1>

      {loading && <p>Chargement…</p>}
      {error && <p>Erreur : {error}</p>}

      <ul>
        {data?.map((game) => (
          <li key={game.id}>
            {game.titre} : ★ {game.avg_rating} ({game.ratings_count} notes)
          </li>
        ))}
      </ul>
    </main>
  );
}

export default CommuPage;
