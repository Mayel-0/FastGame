import { Link } from "react-router-dom";
import type { RecommendedGame } from "../models/game";
import { toSlug } from "../utils/slug";

interface RecommendationsProps {
  games: RecommendedGame[];
}

function Recommendations({ games }: RecommendationsProps) {
  if (games.length === 0) return null;

  return (
    <section className="recommendations" aria-labelledby="recommendations-title">
      <header className="recommendations__header">
        <p className="recommendations__eyebrow">Pour vous</p>
        <h2 className="recommendations__title" id="recommendations-title">Parce que vous avez aimé…</h2>
      </header>
      <ul className="recommendations__list">
        {games.map((game) => (
          <li key={game.id}>
            <Link className="recommendations__card" to={`/jeux/d/${toSlug(game.titre ?? "")}`} state={{ game }}>
              {game.image ? (
                <img className="recommendations__image" src={game.image} alt="" loading="lazy" />
              ) : (
                <span className="recommendations__image recommendations__image--empty" aria-hidden="true">FG</span>
              )}
              <span className="recommendations__copy">
                <span className="recommendations__game-title">{game.titre || "Jeu sans titre"}</span>
                <span className="recommendations__reason">{game.raison}</span>
                {game.note_moyenne != null && (
                  <span className="recommendations__score">★ {game.note_moyenne.toFixed(1)}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Recommendations;
