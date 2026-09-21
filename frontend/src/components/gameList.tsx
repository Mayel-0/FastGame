import type Game from "../models/game";

interface GameListProps {
  games: Game[];
}

function GameList({games}:GameListProps) {
  return (
    <section>
      {games.map((game) => (
        <article key={game.id}>
          <h3>{game.titre}</h3>
        </article>
      ))}
    </section>
  );
}

export default GameList;
